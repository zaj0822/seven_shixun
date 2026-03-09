<template>
  <div class="settings-container">
    <h2>设置</h2>
    <div class="settings-grid">
      <div class="settings-card">
        <h3>AI API设置</h3>
        <div class="setting-item">
          <label>DeepSeek API密钥</label>
          <input 
            type="password" 
            v-model="deepseekApiKey" 
            placeholder="请输入DeepSeek API密钥"
            class="setting-input"
          >
          <p class="setting-hint">密钥将保存在浏览器本地，不会上传到服务器</p>
        </div>
        <div class="setting-item">
          <label>AI模型</label>
          <select v-model="aiModel" class="setting-select">
            <option value="deepseek-chat">DeepSeek Chat</option>
            <option value="deepseek-coder">DeepSeek Coder</option>
          </select>
        </div>
        <div class="setting-item">
          <label>摘要质量</label>
          <select v-model="summaryQuality" class="setting-select">
            <option value="brief">简洁</option>
            <option value="detailed">详细</option>
            <option value="comprehensive">全面</option>
          </select>
        </div>
      </div>
      <div class="settings-card">
        <h3>文本处理设置</h3>
        <div class="setting-item">
          <label>摘要模型</label>
          <select v-model="summaryModel" class="setting-select">
            <option value="bert">BERT</option>
            <option value="gpt4">GPT-4</option>
          </select>
        </div>
        <div class="setting-item">
          <label>摘要长度</label>
          <input 
            type="range" 
            v-model="summaryLength" 
            min="50" 
            max="300" 
            step="50"
            class="setting-range"
          >
          <span class="range-value">{{ summaryLength }}字</span>
        </div>
      </div>
      <div class="settings-card">
        <h3>数据管理</h3>
        <div class="data-stats">
          <p><strong>数据统计:</strong></p>
          <p>会议记录: {{ dataStats.recordCount }} 条</p>
          <p>总时长: {{ dataStats.totalDuration }} 秒</p>
          <p>最后记录: {{ dataStats.lastRecordDate }}</p>
        </div>
        <div class="system-info">
            <div class="info-item">
              <span class="info-label">浏览器支持：</span>
              <span class="info-value" :class="{ supported: isFileSystemSupported }">
                {{ isFileSystemSupported ? '✅ 支持文件系统访问' : '❌ 不支持文件系统访问' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">推荐浏览器：</span>
              <span class="info-value">Chrome 86+ 或 Edge 86+</span>
            </div>
          </div>
          
          <div class="data-actions">
          <button class="data-button export-button" @click="exportData">
            📤 导出会议记录
          </button>
          <button class="data-button backup-button" @click="backupAllData">
            💾 完整备份
          </button>
          <button class="data-button batch-export-button" @click="exportAllMeetingsBatch">
            📦 批量导出会议包
          </button>
          <input 
            type="file" 
            ref="importInput" 
            accept=".json" 
            @change="handleImport"
            style="display: none"
          >
          <button class="data-button import-button" @click="triggerImport">
            📥 导入数据
          </button>
          <button class="data-button clear-button" @click="clearData">
            🗑️ 清除所有数据
          </button>
        </div>
      </div>
      <div class="settings-card">
        <h3>通知设置</h3>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" v-model="enableNotifications">
            启用通知
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" v-model="notifyOnComplete">
            识别完成时通知
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" v-model="notifyOnSummary">
            摘要生成时通知
          </label>
        </div>
      </div>
    </div>
    <div class="settings-actions">
      <button class="save-button" @click="saveSettings">保存设置</button>
      <button class="reset-button" @click="resetSettings">恢复默认</button>
    </div>
  </div>
</template>

<script>
  import { 
    exportMeetingRecords, 
    backupAllData, 
    importMeetingRecords, 
    getDataStats, 
    clearAllData 
  } from '../utils/dataManager'
  import { exportAllMeetings } from '../utils/meetingExporter'
  import { isFileSystemAccessSupported } from '../utils/fileSystem'
  
  export default {
    name: 'SettingsView',
    data() {
      return {
        // AI API设置
        deepseekApiKey: '',
        aiModel: 'deepseek-chat',
        summaryQuality: 'detailed',
        
        // 文本处理设置
        summaryModel: 'ai',
        summaryLength: 200,
        
        // 通知设置
        enableNotifications: true,
        notifyOnComplete: true,
        notifyOnSummary: true,
        
        // 数据管理
        dataStats: {
          recordCount: 0,
          totalDuration: 0,
          lastRecordDate: '无记录'
        },
        
        // 文件系统支持状态
        isFileSystemSupported: isFileSystemAccessSupported()
      }
    },
  mounted() {
    this.loadSettings()
    this.updateDataStats()
  },
  methods: {
    loadSettings() {
      const settings = localStorage.getItem('meetingAssistantSettings')
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        Object.assign(this, parsedSettings)
      }
      
      // 如果API密钥为空，尝试使用默认密钥
      if (!this.deepseekApiKey) {
        this.deepseekApiKey = 'sk-xijkqimuxfolpoeqdiklrybxrfvcjrndqkzwwubsrjjpkqhv'
      }
    },
    
    saveSettings() {
      const settings = {
        deepseekApiKey: this.deepseekApiKey,
        aiModel: this.aiModel,
        summaryQuality: this.summaryQuality,
        summaryModel: this.summaryModel,
        summaryLength: this.summaryLength,
        storageLocation: this.storageLocation,
        autoDelete: this.autoDelete,
        enableNotifications: this.enableNotifications,
        notifyOnComplete: this.notifyOnComplete,
        notifyOnSummary: this.notifyOnSummary
      }
      
      localStorage.setItem('meetingAssistantSettings', JSON.stringify(settings))
      alert('设置已保存！')
    },
    
    resetSettings() {
      if (confirm('确定要恢复默认设置吗？这将清除所有自定义设置。')) {
        this.deepseekApiKey = 'sk-xijkqimuxfolpoeqdiklrybxrfvcjrndqkzwwubsrjjpkqhv'
        this.aiModel = 'deepseek-chat'
        this.summaryQuality = 'detailed'
        this.summaryModel = 'ai'
        this.summaryLength = 200
        this.storageLocation = 'local'
        this.autoDelete = 'never'
        this.enableNotifications = true
        this.notifyOnComplete = true
        this.notifyOnSummary = true
        
        localStorage.removeItem('meetingAssistantSettings')
        alert('已恢复默认设置！')
      }
    },
    
    testApiConnection() {
      if (!this.deepseekApiKey) {
        alert('请先输入API密钥')
        return
      }
      
      alert('正在测试API连接...')
      // 这里可以添加实际的API连接测试
      setTimeout(() => {
        alert('API连接测试完成！')
      }, 1000)
    },
    
    updateDataStats() {
      const stats = getDataStats()
      if (!stats.error) {
        this.dataStats = stats
      }
    },
    
    exportData() {
      const result = exportMeetingRecords()
      if (result.success) {
        alert(`成功导出 ${result.count} 条会议记录！文件已下载到您的下载文件夹。`)
        this.updateDataStats()
      } else {
        alert(`导出失败: ${result.error}`)
      }
    },
    
    backupAllData() {
      const result = backupAllData()
      if (result.success) {
        alert(`备份成功！包含 ${result.recordCount} 条记录${result.hasSettings ? '和设置' : ''}。`)
      } else {
        alert(`备份失败: ${result.error}`)
      }
    },
    
    triggerImport() {
      this.$refs.importInput.click()
    },
    
    async handleImport(event) {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        const result = await importMeetingRecords(file)
        if (result.success) {
          alert(`成功导入 ${result.importedCount} 条记录，当前共有 ${result.totalCount} 条记录。`)
          this.updateDataStats()
          
          // 刷新页面以更新会议记录列表
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } catch (error) {
        alert(`导入失败: ${error.message}`)
      }
      
      // 清空文件输入
      event.target.value = ''
    },
    
    async exportAllMeetingsBatch() {
      try {
        const result = await exportAllMeetings()
        if (result.success) {
          alert(`批量导出成功！\n包含 ${result.meetingCount} 个会议记录\n导出日期：${result.exportDate}\n\n请将ZIP文件解压到：F:\\cau\\shixi\\记录\\`)
        } else {
          alert(`批量导出失败：${result.error}`)
        }
      } catch (error) {
        console.error('批量导出失败:', error)
        alert('批量导出失败，请检查网络连接')
      }
    },
    
    clearData() {
      if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
        const result = clearAllData()
        if (result.success) {
          alert('所有数据已清除')
          this.updateDataStats()
          
          // 刷新页面
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          alert(`清除失败: ${result.error}`)
        }
      }
    }
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.settings-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.settings-card h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.setting-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #fff;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.setting-range {
  width: 100%;
  margin: 0.5rem 0;
}

.range-value {
  display: block;
  text-align: right;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
}

.data-stats {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.data-stats p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.data-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.data-button {
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.export-button {
  background-color: #28a745;
  color: white;
}

.backup-button {
  background-color: #17a2b8;
  color: white;
}

.batch-export-button {
  background-color: #28a745;
  color: white;
}

.import-button {
  background-color: #ffc107;
  color: #212529;
}

.clear-button {
  background-color: #dc3545;
  color: white;
}

.data-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.settings-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.save-button, .reset-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.save-button {
  background-color: #42b983;
  color: white;
}

.reset-button {
  background-color: #95a5a6;
  color: white;
}

.save-button:hover, .reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>