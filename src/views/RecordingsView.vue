<template>
  <div class="recordings-container">
    <h2>会议记录</h2>
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜索会议记录..."
        class="search-input"
      >
      <button class="search-button">搜索</button>
    </div>
    <div class="recordings-list">
      <div 
        v-for="recording in filteredRecordings" 
        :key="recording.id"
        class="recording-card"
        @click="selectRecording(recording)"
      >
        <div class="recording-header">
          <h3>{{ recording.title }}</h3>
          <span class="recording-date">{{ recording.date }}</span>
        </div>
        <div class="recording-meta">
          <span class="duration">{{ recording.duration }}</span>
        </div>
        <div class="recording-summary">
          {{ recording.summary }}
        </div>
        <div class="recording-keywords">
          <span 
            v-for="keyword in recording.keywords" 
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="selectedRecording" class="recording-detail">
      <div class="detail-header">
        <h3>{{ selectedRecording.title }}</h3>
        <button class="close-button" @click="selectedRecording = null">×</button>
      </div>
      <div class="detail-meta">
        <p><strong>日期：</strong>{{ selectedRecording.date }}</p>
        <p><strong>时长：</strong>{{ selectedRecording.duration }}</p>
        <p><strong>参与人数：</strong>{{ selectedRecording.participants }}人</p>
      </div>
      <div class="detail-content">
        <h4>会议摘要</h4>
        <p>{{ selectedRecording.summary }}</p>
        <h4>会议内容</h4>
        <div class="meeting-content">
          {{ selectedRecording.transcript }}
        </div>
        <h4>关键词</h4>
        <div class="detail-keywords">
          <span 
            v-for="keyword in selectedRecording.keywords" 
            :key="keyword"
            class="keyword-tag"
          >
            {{ keyword }}
          </span>
        </div>
      </div>
      <div class="detail-actions">
        <button class="play-button" @click="playAudio" :disabled="!selectedRecording.audioData">
          🔊 播放录音
        </button>
        <button class="download-button" @click="downloadTranscript">
          📄 下载纪要
        </button>
        <button class="export-button" @click="exportMeetingPackage(selectedRecording)">
          📦 导出会议包
        </button>
        <button class="delete-button" @click="deleteRecording(selectedRecording)">
          🗑️ 删除记录
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { exportMeetingPackage } from '../utils/meetingExporter'

export default {
  name: 'RecordingsView',
  data() {
    return {
      searchQuery: '',
      selectedRecording: null,
      recordings: []
    }
  },
  mounted() {
    this.loadRecordings()
  },
  watch: {
    '$route'() {
      this.loadRecordings()
    }
  },
  computed: {
    filteredRecordings() {
      if (!this.searchQuery) {
        return this.recordings
      }
      const query = this.searchQuery.toLowerCase()
      return this.recordings.filter(recording => 
        recording.title.toLowerCase().includes(query) ||
        recording.summary.toLowerCase().includes(query) ||
        recording.keywords.some(keyword => keyword.toLowerCase().includes(query))
      )
    }
  },
  methods: {
    loadRecordings() {
      const storedRecords = localStorage.getItem('meetingRecords')
      if (storedRecords) {
        this.recordings = JSON.parse(storedRecords).map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString('zh-CN'),
          duration: record.duration ? `${record.duration}秒` : '未知时长'
        }))
      }
    },
    
    selectRecording(recording) {
      this.selectedRecording = recording
    },
    
    playAudio() {
      if (this.selectedRecording && this.selectedRecording.audioData) {
        const audio = new Audio(this.selectedRecording.audioData)
        audio.play()
      }
    },
    
    downloadTranscript() {
      if (this.selectedRecording) {
        const content = `会议记录：${this.selectedRecording.title}
日期：${this.selectedRecording.date}
时长：${this.selectedRecording.duration}

会议内容：
${this.selectedRecording.transcript}

会议摘要：
${this.selectedRecording.summary}

关键词：${this.selectedRecording.keywords.join(', ')}`
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${this.selectedRecording.title}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    },
    
    async exportMeetingPackage(recording) {
      try {
        const result = await exportMeetingPackage(recording)
        if (result.success) {
          alert(`会议包导出成功！\n文件夹名称：${result.folderName}\n包含 ${result.fileCount} 个文件\n\n请将ZIP文件解压到：F:\\cau\\shixi\\记录\\`)
        } else {
          alert(`导出失败：${result.error}`)
        }
      } catch (error) {
        console.error('导出会议包失败:', error)
        alert('导出失败，请检查网络连接')
      }
    },
    
    deleteRecording(recording) {
      if (confirm('确定要删除这条会议记录吗？')) {
        const updatedRecords = this.recordings.filter(r => r.id !== recording.id)
        localStorage.setItem('meetingRecords', JSON.stringify(updatedRecords))
        this.recordings = updatedRecords
        this.selectedRecording = null
      }
    }
  }
}
</script>

<style scoped>
.recordings-container {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.search-button:hover {
  background-color: #35495e;
  transform: translateY(-2px);
}

.recordings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.recording-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.recording-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.recording-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.recording-header h3 {
  color: #333;
  font-size: 1.1rem;
  margin: 0;
}

.recording-date {
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
}

.recording-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.recording-summary {
  margin-bottom: 1rem;
  line-height: 1.5;
  color: #555;
  font-size: 0.95rem;
}

.recording-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.keyword-tag {
  background-color: #e8f4f8;
  color: #3498db;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.recording-detail {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 2rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.detail-header h3 {
  color: #333;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-meta {
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.detail-meta p {
  margin: 0.5rem 0;
  color: #555;
}

.detail-content {
  margin-bottom: 2rem;
}

.detail-content h4 {
  color: #333;
  margin: 1.5rem 0 1rem;
}

.detail-content p {
  line-height: 1.6;
  color: #555;
}

.meeting-content {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
}

.detail-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.play-button, .download-button, .share-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.play-button {
  background-color: #42b983;
  color: white;
}

.download-button {
  background-color: #3498db;
  color: white;
}

.export-button {
  background-color: #28a745;
  color: white;
}

.play-button:hover, .download-button:hover, .share-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>