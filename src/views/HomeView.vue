<template>
  <div class="home-container">
    <div class="hero-section">
      <h1>智能会议助手</h1>
      <p>AI驱动的会议记录与摘要生成工具</p>
      
      <div class="action-buttons">
        <button class="create-meeting-button" @click="goToCreateMeeting">
          ✍️ 创建新会议
        </button>
        <button class="view-records-button" @click="goToRecordings">
          📋 查看会议记录
        </button>
      </div>
    </div>
    
    <div class="features-section">
      <h2>核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <h3>🎤 专业录音</h3>
          <p>支持实时录音、暂停/继续、音频上传</p>
        </div>
        <div class="feature-card">
          <h3>🤖 AI智能摘要</h3>
          <p>集成DeepSeek API生成高质量会议摘要</p>
        </div>
        <div class="feature-card">
          <h3>📝 完整记录</h3>
          <p>录音内容、关键词、会议信息完整保存</p>
        </div>
        <div class="feature-card">
          <h3>💾 多种保存</h3>
          <p>支持本地存储和文件系统保存</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  methods: {
    goToCreateMeeting() {
      this.$router.push('/create-meeting')
    },
    
    goToRecordings() {
      this.$router.push('/recordings')
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero-section {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 3rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.hero-section h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.create-meeting-button,
.view-records-button {
  padding: 1.25rem 2.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
}

.create-meeting-button {
  background-color: white;
  color: #667eea;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.view-records-button {
  background-color: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.3);
}

.create-meeting-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  background-color: #f0f0f0;
}

.view-records-button:hover {
  transform: translateY(-3px);
  background-color: rgba(255,255,255,0.3);
}

.features-section {
  margin-top: 3rem;
}

.features-section h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  color: #333;
  font-size: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  transition: all 0.3s;
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #667eea;
  font-size: 1.5rem;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  font-size: 1rem;
}
</style>
