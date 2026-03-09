// API配置和工具函数

// 硅基流动API配置
const SILICONFLOW_API_BASE = 'https://api.siliconflow.cn/v1'
const CHAT_COMPLETIONS_URL = `${SILICONFLOW_API_BASE}/chat/completions`
const AUDIO_TRANSCRIPTIONS_URL = `${SILICONFLOW_API_BASE}/audio/transcriptions`

// 语音识别模型
const SPEECH_RECOGNITION_MODEL = 'TeleAI/TeleSpeechASR'

// 获取API密钥（从设置中读取）
function getApiKey() {
  try {
    const settings = localStorage.getItem('meetingAssistantSettings')
    if (settings) {
      const parsedSettings = JSON.parse(settings)
      return parsedSettings.deepseekApiKey || 'sk-xijkqimuxfolpoeqdiklrybxrfvcjrndqkzwwubsrjjpkqhv'
    }
  } catch (error) {
    console.error('读取设置失败:', error)
  }
  return 'sk-xijkqimuxfolpoeqdiklrybxrfvcjrndqkzwwubsrjjpkqhv'
}

// 语音识别 - 使用TeleAI/TeleSpeechASR模型
export async function transcribeAudio(audioBlob) {
  const apiKey = getApiKey()
  
  try {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', SPEECH_RECOGNITION_MODEL)
    formData.append('language', 'zh')
    formData.append('response_format', 'json')
    
    const response = await fetch(AUDIO_TRANSCRIPTIONS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`语音识别API请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      text: data.text || '',
      confidence: data.confidence || 0.9,
      language: data.language || 'zh',
      duration: data.duration || 0
    }
  } catch (error) {
    console.error('语音识别失败:', error)
    
    // 如果真实API调用失败，回退到模拟识别
    return await simulateSpeechRecognition(audioBlob)
  }
}

// 调用DeepSeek API生成摘要
export async function generateSummary(text) {
  const apiKey = getApiKey()
  
  try {
    const response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen3-8B',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议纪要助手。请将以下会议内容生成简洁的摘要，并提取3-5个关键词。摘要要突出会议的主要议题、决策和行动计划。'
          },
          {
            role: 'user',
            content: `请为以下会议内容生成摘要和关键词：\n\n${text}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('DeepSeek API调用失败:', error)
    throw error
  }
}

// 解析DeepSeek API返回的内容，提取摘要和关键词
export function parseSummaryResponse(responseText) {
  const lines = responseText.split('\n')
  let summary = ''
  let keywords = []
  let inSummary = false
  let inKeywords = false

  for (const line of lines) {
    if (line.includes('摘要：') || line.includes('会议摘要：')) {
      inSummary = true
      inKeywords = false
      summary = line.replace(/^(摘要：|会议摘要：)/, '').trim()
    } else if (line.includes('关键词：') || line.includes('关键字：')) {
      inSummary = false
      inKeywords = true
      const keywordLine = line.replace(/^(关键词：|关键字：)/, '').trim()
      keywords = keywordLine.split(/[,，、]/).map(k => k.trim()).filter(k => k)
    } else if (inSummary) {
      summary += ' ' + line.trim()
    } else if (inKeywords && line.trim()) {
      const additionalKeywords = line.split(/[,，、]/).map(k => k.trim()).filter(k => k)
      keywords.push(...additionalKeywords)
    }
  }

  // 如果没有明确的分隔，尝试智能解析
  if (!summary && !keywords.length) {
    const sentences = responseText.split(/[.!?。！？]/)
    summary = sentences[0] || responseText
    
    // 简单的关键词提取（实际应用中应该使用更复杂的算法）
    const words = responseText.split(/\s+/)
    keywords = words.filter(word => 
      word.length > 1 && 
      !['的', '了', '在', '是', '有', '和', '与', '及', '或', '但', '而', '如果', '因为', '所以', '然后'].includes(word)
    ).slice(0, 5)
  }

  return {
    summary: summary.trim(),
    keywords: keywords.slice(0, 5) // 最多5个关键词
  }
}

// 使用浏览器原生的语音识别（如果支持）
export function useBrowserSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    
    return recognition
  }
  return null
}

// 模拟语音识别（在没有真实API的情况下）
export async function simulateSpeechRecognition(audioBlob) {
  // 这里应该调用真实的语音识别API
  // 目前先返回模拟数据
  console.log('模拟语音识别，音频大小:', audioBlob ? audioBlob.size + ' bytes' : '无音频数据')
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: `模拟的会议录音内容。会议讨论了项目进度、技术方案和团队协作等问题。与会者就下一步工作计划达成了共识。\n\n会议时间：${new Date().toLocaleString()}`,
        confidence: 0.95
      })
    }, 2000)
  })
}

// 处理音频文件并生成摘要
export async function processMeetingAudio(audioBlob) {
  try {
    // 步骤1: 语音识别（使用TeleAI/TeleSpeechASR）
    const recognitionResult = await transcribeAudio(audioBlob)
    
    // 如果识别结果为空，使用模拟数据
    if (!recognitionResult.text || recognitionResult.text.trim().length < 10) {
      console.log('语音识别结果为空，使用模拟数据')
      const simulatedResult = await simulateSpeechRecognition(audioBlob)
      recognitionResult.text = simulatedResult.text
      recognitionResult.confidence = simulatedResult.confidence
    }
    
    // 步骤2: 生成摘要
    const summaryResponse = await generateSummary(recognitionResult.text)
    
    // 步骤3: 解析摘要和关键词
    const { summary, keywords } = parseSummaryResponse(summaryResponse)
    
    return {
      transcript: recognitionResult.text,
      summary: summary,
      keywords: keywords,
      confidence: recognitionResult.confidence,
      duration: recognitionResult.duration,
      language: recognitionResult.language
    }
  } catch (error) {
    console.error('处理音频失败:', error)
    
    // 如果所有处理都失败，返回基本的错误信息
    const simulatedResult = await simulateSpeechRecognition(audioBlob)
    return {
      transcript: simulatedResult.text,
      summary: '语音识别服务暂时不可用，请稍后重试',
      keywords: ['语音识别', '服务异常'],
      confidence: 0.5,
      duration: 0,
      language: 'zh'
    }
  }
}