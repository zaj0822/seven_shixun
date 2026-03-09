// 会议记录导出工具 - 生成完整的会议包

// 动态加载JSZip库
async function loadJSZip() {
  if (window.JSZip) {
    return window.JSZip
  }
  
  // 从CDN加载JSZip
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
    script.onload = () => resolve(window.JSZip)
    script.onerror = () => reject(new Error('无法加载JSZip库'))
    document.head.appendChild(script)
  })
}

// 生成会议文件夹结构并导出为ZIP包
export async function exportMeetingPackage(meetingRecord) {
  try {
    const JSZip = await loadJSZip()
    const zip = new JSZip()
    
    // 创建会议文件夹
    const meetingFolderName = generateFolderName(meetingRecord)
    const meetingFolder = zip.folder(meetingFolderName)
    
    // 1. 保存会议基本信息
    const meetingInfo = generateMeetingInfo(meetingRecord)
    meetingFolder.file('会议信息.txt', meetingInfo)
    
    // 2. 保存录音内容（文本）
    meetingFolder.file('录音内容.txt', meetingRecord.transcript)
    
    // 3. 保存会议摘要
    meetingFolder.file('会议摘要.txt', meetingRecord.summary)
    
    // 4. 保存关键词
    const keywordsContent = generateKeywordsContent(meetingRecord.keywords)
    meetingFolder.file('关键词.txt', keywordsContent)
    
    // 5. 保存JSON格式的完整数据（便于程序读取）
    const jsonData = generateJSONData(meetingRecord)
    meetingFolder.file('会议数据.json', JSON.stringify(jsonData, null, 2))
    
    // 6. 保存音频文件（如果存在）
    if (meetingRecord.audioData) {
      try {
        const audioBlob = await fetch(meetingRecord.audioData).then(r => r.blob())
        meetingFolder.file('录音音频.webm', audioBlob)
      } catch (error) {
        console.warn('无法导出音频文件:', error)
      }
    }
    
    // 7. 生成README文件
    const readmeContent = generateReadmeContent(meetingRecord)
    meetingFolder.file('README.md', readmeContent)
    
    // 生成ZIP文件
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    // 下载ZIP文件
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meetingFolderName}.zip`
    a.click()
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    return {
      success: true,
      folderName: meetingFolderName,
      fileCount: Object.keys(meetingFolder.files).length,
      downloadPath: a.download
    }
    
  } catch (error) {
    console.error('导出会议包失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 生成文件夹名称（使用会议标题和日期）
function generateFolderName(record) {
  const date = new Date(record.date)
  const dateStr = date.toISOString().split('T')[0]
  const title = record.title.replace(/[\\/:*?"<>|]/g, '_') // 移除非法字符
  return `${dateStr}_${title}`
}

// 生成会议信息文件内容
function generateMeetingInfo(record) {
  const date = new Date(record.date)
  return `会议记录信息
================

会议标题：${record.title}
会议日期：${date.toLocaleString('zh-CN')}
会议时长：${record.duration} 秒
录音文件：${record.audioData ? '录音音频.webm' : '无录音文件'}

创建时间：${new Date().toLocaleString('zh-CN')}
导出工具：智能会议助手 v1.0
`
}

// 生成关键词文件内容
function generateKeywordsContent(keywords) {
  if (!keywords || keywords.length === 0) {
    return '本次会议未提取到关键词'
  }
  
  let content = '会议关键词\n==========\n\n'
  keywords.forEach((keyword, index) => {
    content += `${index + 1}. ${keyword}\n`
  })
  
  content += `\n总计：${keywords.length} 个关键词\n`
  return content
}

// 生成JSON格式数据
function generateJSONData(record) {
  return {
    meeting: {
      id: record.id,
      title: record.title,
      date: record.date,
      duration: record.duration,
      files: {
        audio: '录音音频.webm',
        transcript: '录音内容.txt',
        summary: '会议摘要.txt',
        keywords: '关键词.txt',
        info: '会议信息.txt'
      }
    },
    content: {
      transcript: record.transcript,
      summary: record.summary,
      keywords: record.keywords
    },
    exportInfo: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      tool: '智能会议助手'
    }
  }
}

// 生成README文件内容
function generateReadmeContent(record) {
  return `# ${record.title}

## 会议记录包说明

此文件夹包含完整的会议记录内容，由智能会议助手自动生成。

### 文件说明

- **会议信息.txt** - 会议基本信息
- **录音内容.txt** - 语音识别转换的文本内容
- **会议摘要.txt** - AI生成的会议摘要
- **关键词.txt** - 提取的关键词列表
- **会议数据.json** - 结构化数据（便于程序处理）
- **录音音频.webm** - 原始录音文件（如存在）

### 使用建议

1. 将此文件夹解压到您的项目目录中
2. 推荐路径：\`F:\\cau\\shixi\\记录\\${generateFolderName(record)}\\\`
3. 可以使用文本编辑器查看所有文本文件
4. JSON文件可用于程序化处理

### 技术信息

- 生成时间：${new Date().toLocaleString('zh-CN')}
- 语音识别：TeleAI/TeleSpeechASR
- 摘要生成：DeepSeek AI
- 文件编码：UTF-8

---
*由智能会议助手生成*`
}

// 导出所有会议记录为批量ZIP包
export async function exportAllMeetings() {
  try {
    const JSZip = await loadJSZip()
    const records = JSON.parse(localStorage.getItem('meetingRecords') || '[]')
    
    if (records.length === 0) {
      throw new Error('没有找到会议记录')
    }
    
    const zip = new JSZip()
    const exportDate = new Date().toISOString().split('T')[0]
    
    // 创建主文件夹
    const mainFolder = zip.folder(`会议记录备份_${exportDate}`)
    
    // 为每个会议创建子文件夹
    for (const record of records) {
      const meetingFolder = mainFolder.folder(generateFolderName(record))
      
      // 保存基本信息
      meetingFolder.file('会议信息.txt', generateMeetingInfo(record))
      meetingFolder.file('录音内容.txt', record.transcript)
      meetingFolder.file('会议摘要.txt', record.summary)
      meetingFolder.file('关键词.txt', generateKeywordsContent(record.keywords))
      meetingFolder.file('会议数据.json', JSON.stringify(generateJSONData(record), null, 2))
    }
    
    // 生成索引文件
    const indexContent = generateIndexContent(records, exportDate)
    mainFolder.file('索引说明.txt', indexContent)
    
    // 生成ZIP文件
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    // 下载ZIP文件
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `会议记录批量备份_${exportDate}.zip`
    a.click()
    
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    return {
      success: true,
      meetingCount: records.length,
      exportDate: exportDate
    }
    
  } catch (error) {
    console.error('批量导出失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 生成批量导出的索引文件内容
function generateIndexContent(records, exportDate) {
  let content = `会议记录批量备份索引
====================

导出日期：${exportDate}
会议数量：${records.length} 个

会议列表：\n\n`
  
  records.forEach((record, index) => {
    const date = new Date(record.date)
    content += `${index + 1}. ${record.title}\n`
    content += `   日期：${date.toLocaleDateString('zh-CN')}\n`
    content += `   时长：${record.duration} 秒\n`
    content += `   文件夹：${generateFolderName(record)}\n\n`
  })
  
  content += `使用说明：\n`
  content += `1. 将此ZIP文件解压到 F:\\cau\\shixi\\记录\\ 目录\n`
  content += `2. 每个会议都有独立的文件夹\n`
  content += `3. 文件夹名称格式：日期_会议标题\n`
  content += `4. 推荐定期备份会议记录\n`
  
  return content
}