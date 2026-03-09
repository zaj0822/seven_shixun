<template>
  <div class="meeting-create-container">
    <!-- 会议表单 -->
    <div class="form-section">
      <h2>创建新会议</h2>
      
      <div class="form-group">
        <label for="meetingName">会议名称 *</label>
        <input 
          type="text" 
          id="meetingName" 
          v-model="meetingForm.name" 
          placeholder="请输入会议名称"
          required
        >
      </div>
      
      <div class="form-group">
        <label for="meetingDate">会议时间 *</label>
        <input 
          type="datetime-local" 
          id="meetingDate" 
          v-model="meetingForm.date" 
          required
        >
      </div>
      
      <div class="form-group">
        <label for="meetingDescription">会议简介</label>
        <textarea 
          id="meetingDescription" 
          v-model="meetingForm.description" 
          placeholder="请输入会议简介（可选）"
          rows="4"
        ></textarea>
      </div>
    </div>
    
    <!-- 录音区域 -->
    <div class="recording-section">
      <h2>录音</h2>
      
      <div class="recording-controls">
        <div class="recording-buttons">
          <button 
            class="record-button" 
            :class="{ 
              active: isRecording, 
              paused: isRecordingPaused 
            }"
            @click="toggleRecording"
            :disabled="!isRecordingSupported"
          >
            <span class="button-icon">{{ getRecordButtonIcon() }}</span>
            {{ getRecordButtonText() }}
          </button>
          
          <button 
            class="pause-button" 
            @click="togglePause"
            :disabled="!isRecording || isProcessing"
            v-if="isRecordingSupported"
          >
            <span class="button-icon">{{ isRecordingPaused ? '▶️' : '⏸️' }}</span>
            {{ isRecordingPaused ? '继续' : '暂停' }}
          </button>
          
          <input 
            type="file" 
            ref="audioInput" 
            accept="audio/*" 
            @change="handleAudioUpload"
            style="display: none"
          >
          <button class="upload-button" @click="triggerFileUpload" :disabled="isRecording">
            <span class="button-icon">📁</span>
            上传音频
          </button>
          
          <button class="process-button" @click="processAudio" :disabled="!audioData || isProcessing">
            <span class="button-icon">🤖</span>
            {{ isProcessing ? '处理中...' : '生成摘要' }}
          </button>
          
          <button 
            class="save-button" 
            @click="saveRecordingToLocal" 
            :disabled="!audioData"
            v-if="isFileSystemSupported"
          >
            <span class="button-icon">💾</span>
            保存到本地
          </button>
        </div>
        
        <div class="recording-status" v-if="isRecording">
          <div class="recording-timer">
            <span class="timer-icon">⏱️</span>
            <span class="timer-text">{{ formatTime(recordingTime) }}</span>
          </div>
          <div class="recording-indicator">
            <span class="indicator-dot" :class="{ active: !isRecordingPaused }"></span>
            <span class="indicator-text">{{ isRecordingPaused ? '已暂停' : '录音中...' }}</span>
          </div>
        </div>
        
        <div class="recording-progress" v-if="isRecording">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: recordingProgress + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            录音进度: {{ recordingProgress.toFixed(1) }}%
          </div>
        </div>
      </div>
      
      <div class="audio-info" v-if="audioData && !isRecording">
        <p>音频时长: {{ audioDuration }}秒</p>
        <p>文件大小: {{ audioSize }}KB</p>
        <p v-if="processingResult.duration">识别时长: {{ processingResult.duration }}秒</p>
        <p v-if="processingResult.language">识别语言: {{ processingResult.language }}</p>
        <p v-if="processingResult.confidence">识别准确率: {{ Math.round(processingResult.confidence * 100) }}%</p>
      </div>
      
      <div class="transcript-container">
        <h3>录音内容</h3>
        <div class="transcript-content">
          {{ transcript }}
        </div>
      </div>
      
      <div class="summary-container" v-if="summary">
        <h3>智能摘要</h3>
        <div class="summary-content">
          {{ summary }}
        </div>
      </div>
      
      <div class="keywords-container" v-if="keywords.length > 0">
        <h3>关键词</h3>
        <div class="keywords-list">
          <span v-for="keyword in keywords" :key="keyword" class="keyword-tag">
            {{ keyword }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 保存按钮 -->
    <div class="action-buttons">
      <button class="save-meeting-button" @click="saveMeeting" :disabled="!audioData">
        💾 保存会议
      </button>
      <button class="cancel-button" @click="goBack">
        ❌ 取消
      </button>
    </div>
  </div>
</template>

<script>
import { processMeetingAudio } from '../utils/api'
import { saveRecordingToPath, isFileSystemAccessSupported } from '../utils/fileSystem'

export default {
  name: 'MeetingCreateView',
  data() {
    return {
      meetingForm: {
        name: '',
        date: '',
        description: ''
      },
      isRecording: false,
      isRecordingPaused: false,
      isRecordingSupported: false,
      isFileSystemSupported: false,
      mediaRecorder: null,
      audioChunks: [],
      audioData: null,
      audioDuration: 0,
      audioSize: 0,
      transcript: '请点击开始录音或上传音频文件...',
      summary: '',
      keywords: [],
      isProcessing: false,
      browserSpeechRecognition: null,
      processingResult: {
        duration: 0,
        language: '',
        confidence: 0
      },
      recordingTime: 0,
      recordingTimer: null,
      recordingProgress: 0,
      maxRecordingTime: 3600
    }
  },
  async mounted() {
    // 检查浏览器是否支持录音
    this.checkRecordingSupport()
    
    // 检查浏览器是否支持文件系统访问API
    this.isFileSystemSupported = isFileSystemAccessSupported()
  },
  methods: {
    async checkRecordingSupport() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          this.isRecordingSupported = true
          stream.getTracks().forEach(track => track.stop())
        } catch (error) {
          console.error('录音权限被拒绝:', error)
          this.transcript = '无法访问麦克风，请检查浏览器权限设置'
        }
      } else {
        this.transcript = '您的浏览器不支持录音功能'
      }
    },
    
    async toggleRecording() {
      if (!this.isRecording) {
        await this.startRecording()
      } else {
        this.stopRecording()
      }
    },
    
    async startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        })
        this.audioChunks = []
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data)
          }
        }
        
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
          this.audioData = audioBlob
          this.audioSize = Math.round(audioBlob.size / 1024)
          this.audioDuration = this.recordingTime
          this.transcript = '录音完成！点击"生成摘要"按钮进行处理。'
          
          // 停止所有音轨
          stream.getTracks().forEach(track => track.stop())
          
          // 停止计时器
          this.stopRecordingTimer()
        }
        
        this.mediaRecorder.onpause = () => {
          this.isRecordingPaused = true
          this.stopRecordingTimer()
        }
        
        this.mediaRecorder.onresume = () => {
          this.isRecordingPaused = false
          this.startRecordingTimer()
        }
        
        this.mediaRecorder.start(1000)
        this.isRecording = true
        this.isRecordingPaused = false
        this.recordingTime = 0
        this.recordingProgress = 0
        this.transcript = '正在录音中...请开始说话'
        
        this.startRecordingTimer()
        
      } catch (error) {
        console.error('录音失败:', error)
        this.transcript = '录音失败，请检查麦克风权限'
      }
    },
    
    stopRecording() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop()
        this.isRecording = false
        this.isRecordingPaused = false
        this.stopRecordingTimer()
      }
    },
    
    togglePause() {
      if (!this.mediaRecorder || !this.isRecording) return
      
      if (this.isRecordingPaused) {
        this.mediaRecorder.resume()
      } else {
        this.mediaRecorder.pause()
      }
    },
    
    startRecordingTimer() {
      this.stopRecordingTimer()
      
      this.recordingTimer = setInterval(() => {
        if (!this.isRecordingPaused) {
          this.recordingTime++
          this.recordingProgress = (this.recordingTime / this.maxRecordingTime) * 100
          
          if (this.recordingTime >= this.maxRecordingTime) {
            this.stopRecording()
          }
        }
      }, 1000)
    },
    
    stopRecordingTimer() {
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer)
        this.recordingTimer = null
      }
    },
    
    triggerFileUpload() {
      this.$refs.audioInput.click()
    },
    
    handleAudioUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.audioData = file
        this.audioSize = Math.round(file.size / 1024)
        this.audioDuration = Math.round(file.size / 10000) // 估算时长
        this.transcript = `已上传音频文件：${file.name}`
      }
    },
    
    getRecordButtonIcon() {
      if (this.isRecording) {
        return this.isRecordingPaused ? '⏹️' : '⏺️'
      }
      return '🎤'
    },
    
    getRecordButtonText() {
      if (this.isRecording) {
        return this.isRecordingPaused ? '继续录音' : '停止录音'
      }
      return '开始录音'
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },
    
    async processAudio() {
      if (!this.audioData) {
        this.transcript = '请先录音或上传音频文件'
        return
      }
      
      this.isProcessing = true
      this.transcript = '正在调用处理音频...'
      
      try {
        const result = await processMeetingAudio(this.audioData)
        
        this.transcript = `录音内容：\n\n${result.transcript}`
        this.summary = result.summary
        this.keywords = result.keywords
        this.processingResult = {
          duration: result.duration || 0,
          language: result.language || 'zh',
          confidence: result.confidence || 0.9
        }
        
      } catch (error) {
        console.error('处理失败:', error)
        
        if (error.message.includes('API请求失败')) {
          this.transcript = 'API调用失败，请检查API密钥和网络连接'
        } else if (error.message.includes('网络')) {
          this.transcript = '网络连接失败，请检查网络设置'
        } else {
          // 如果API调用失败，使用模拟数据
          await this.simulateProcessing()
        }
      } finally {
        this.isProcessing = false
      }
    },
    
    simulateProcessing() {
      return new Promise(resolve => {
        setTimeout(() => {
          this.transcript = `录音内容：\n\n这是一段模拟的会议录音内容。会议讨论了项目进度、技术方案和团队协作等问题。与会者就下一步工作计划达成了共识。`
          
          this.summary = '会议摘要：本次会议主要讨论了项目进展和技术方案，确定了下一步的工作计划，强调了团队协作的重要性。'
          
          this.keywords = ['项目进度', '技术方案', '团队协作', '工作计划']
          this.processingResult = {
            duration: 300,
            language: 'zh',
            confidence: 0.92
          }
          resolve()
        }, 2000)
      })
    },
    
    async saveRecordingToLocal() {
      if (!this.audioData) {
        this.transcript = '请先录音或上传音频文件'
        return
      }
      
      try {
        if (!isFileSystemAccessSupported()) {
          alert('您的浏览器不支持文件系统访问API，请使用Chrome或Edge浏览器')
          return
        }
        
        const meetingRecord = {
          id: Date.now(),
          title: this.meetingForm.name || '未命名会议',
          date: this.meetingForm.date || new Date().toISOString(),
          duration: this.audioDuration,
          transcript: this.transcript,
          summary: this.summary,
          keywords: this.keywords,
          description: this.meetingForm.description,
          audioData: this.audioData ? URL.createObjectURL(this.audioData) : null
        }
        
        const result = await saveRecordingToPath(meetingRecord)
        
        if (result.success) {
          this.transcript += `\n\n✅ 录音已保存到本地！\n\n保存位置：${result.folderPath}\n包含 ${result.filesSaved} 个文件`
          alert(`录音保存成功！\n\n保存位置：${result.folderPath}\n包含 ${result.filesSaved} 个文件`)
        } else {
          alert(`保存失败：${result.error}`)
        }
        
      } catch (error) {
        console.error('保存录音失败:', error)
        this.transcript = '保存失败，请检查浏览器支持和权限设置'
      }
    },
    
    async saveMeeting() {
      if (!this.audioData) {
        alert('请先录音或上传音频文件')
        return
      }
      
      if (!this.meetingForm.name) {
        alert('请输入会议名称')
        return
      }
      
      if (!this.meetingForm.date) {
        alert('请选择会议时间')
        return
      }
      
      // 检查是否已经处理过音频
      if (!this.summary || !this.keywords || this.keywords.length === 0) {
        const confirmProcess = confirm('您还没有生成会议摘要，是否现在生成？\n\n点击"确定"生成摘要，点击"取消"直接保存（将使用空摘要）。')
        if (confirmProcess) {
          await this.processAudio()
          // 如果处理失败，仍然允许保存
        }
      }
      
      const meetingRecord = {
        id: Date.now(),
        title: this.meetingForm.name,
        date: this.meetingForm.date,
        description: this.meetingForm.description,
        duration: this.audioDuration,
        transcript: this.transcript,
        summary: this.summary || '暂无摘要',
        keywords: this.keywords || ['暂无关键词'],
        audioData: this.audioData ? URL.createObjectURL(this.audioData) : null
      }
      
      // 先保存到本地存储
      const existingRecords = JSON.parse(localStorage.getItem('meetingRecords') || '[]')
      existingRecords.unshift(meetingRecord)
      localStorage.setItem('meetingRecords', JSON.stringify(existingRecords))
      
      // 然后保存到本地路径
      if (isFileSystemAccessSupported()) {
        try {
          const result = await saveRecordingToPath(meetingRecord)
          if (result.success) {
            alert(`会议保存成功！\n\n已保存到本地存储\n本地保存位置：${result.folderPath}\n包含 ${result.filesSaved} 个文件`)
          } else {
            alert(`会议保存成功！\n\n已保存到本地存储\n本地保存失败：${result.error}`)
          }
        } catch (error) {
          console.error('保存到本地失败:', error)
          alert(`会议保存成功！\n\n已保存到本地存储\n本地保存失败：${error.message}`)
        }
      } else {
        alert('会议保存成功！\n\n已保存到本地存储')
      }
      
      // 返回上一页
      this.$router.replace('/recordings')
    },
    
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.meeting-create-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-section h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.recording-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.recording-section h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.recording-controls {
  margin-bottom: 1.5rem;
}

.recording-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.record-button, .pause-button, .upload-button, .process-button, .save-button {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
}

.record-button {
  background-color: #42b983;
  color: white;
}

.record-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.record-button.active {
  background-color: #e74c3c;
  animation: pulse 2s infinite;
}

.record-button.paused {
  background-color: #f39c12;
}

.pause-button {
  background-color: #f39c12;
  color: white;
}

.pause-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.upload-button {
  background-color: #3498db;
  color: white;
}

.process-button {
  background-color: #9b59b6;
  color: white;
}

.process-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.save-button {
  background-color: #28a745;
  color: white;
}

.save-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.record-button:hover:not(:disabled), 
.pause-button:hover:not(:disabled),
.upload-button:hover:not(:disabled), 
.process-button:hover:not(:disabled),
.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.button-icon {
  font-size: 1.1rem;
}

.recording-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.recording-timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #e74c3c;
}

.timer-icon {
  font-size: 1.2rem;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #95a5a6;
  transition: all 0.3s;
}

.indicator-dot.active {
  background-color: #e74c3c;
  animation: blink 1s infinite;
}

.recording-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983, #3498db);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.audio-info {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.audio-info p {
  margin: 0.5rem 0;
  color: #666;
}

.transcript-container,
.summary-container,
.keywords-container {
  margin-bottom: 1.5rem;
}

.transcript-container h3,
.summary-container h3,
.keywords-container h3 {
  margin-bottom: 0.75rem;
  color: #333;
}

.transcript-content,
.summary-content {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  min-height: 100px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.summary-content {
  background-color: #e8f5e9;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.save-meeting-button,
.cancel-button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
  max-width: 200px;
}

.save-meeting-button {
  background-color: #42b983;
  color: white;
}

.save-meeting-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #e74c3c;
  color: white;
}

.save-meeting-button:hover:not(:disabled),
.cancel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}
</style>
