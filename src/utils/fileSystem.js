// 文件系统访问工具 - 使用File System Access API

// 保存录音到本地路径
export async function saveRecordingToPath(recording) {
  try {
    // 检查浏览器是否支持File System Access API
    if (!('showDirectoryPicker' in window)) {
      throw new Error('您的浏览器不支持文件系统访问API')
    }
    
    // 选择保存目录
    const dirHandle = await window.showDirectoryPicker({
      startIn: 'downloads'
    })
    
    // 创建会议文件夹
    let date
    try {
      date = new Date(recording.date)
      if (isNaN(date.getTime())) {
        // 如果日期无效，使用当前时间
        date = new Date()
      }
    } catch (error) {
      // 如果日期解析失败，使用当前时间
      date = new Date()
    }
    
    const dateStr = date.toISOString().split('T')[0]
    const folderName = `${dateStr}_${recording.title.replace(/[\\/:*?"<>|]/g, '_')}`
    
    let folderHandle
    try {
      folderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true })
    } catch (error) {
      // 如果文件夹已存在，获取它
      folderHandle = await dirHandle.getDirectoryHandle(folderName)
    }
    
    // 保存录音音频
    if (recording.audioData) {
      try {
        const audioBlob = await fetch(recording.audioData).then(r => r.blob())
        const audioFileHandle = await folderHandle.getFileHandle('录音音频.webm', { create: true })
        const writable = await audioFileHandle.createWritable()
        await writable.write(audioBlob)
        await writable.close()
      } catch (error) {
        console.warn('无法保存音频文件:', error)
      }
    }
    
    // 保存录音内容
    const transcriptFileHandle = await folderHandle.getFileHandle('录音内容.txt', { create: true })
    const transcriptWritable = await transcriptFileHandle.createWritable()
    await transcriptWritable.write(recording.transcript)
    await transcriptWritable.close()
    
    // 保存会议摘要
    const summaryFileHandle = await folderHandle.getFileHandle('会议摘要.txt', { create: true })
    const summaryWritable = await summaryFileHandle.createWritable()
    await summaryWritable.write(recording.summary)
    await summaryWritable.close()
    
    // 保存关键词
    const keywordsContent = recording.keywords 
      ? recording.keywords.join(', ') 
      : '无关键词'
    const keywordsFileHandle = await folderHandle.getFileHandle('关键词.txt', { create: true })
    const keywordsWritable = await keywordsFileHandle.createWritable()
    await keywordsWritable.write(keywordsContent)
    await keywordsWritable.close()
    
    // 保存会议信息
    const infoContent = generateMeetingInfo(recording)
    const infoFileHandle = await folderHandle.getFileHandle('会议信息.txt', { create: true })
    const infoWritable = await infoFileHandle.createWritable()
    await infoWritable.write(infoContent)
    await infoWritable.close()
    
    // 保存JSON数据
    const jsonData = {
      meeting: {
        id: recording.id,
        title: recording.title,
        date: recording.date,
        duration: recording.duration
      },
      content: {
        transcript: recording.transcript,
        summary: recording.summary,
        keywords: recording.keywords
      },
      exportInfo: {
        exportedAt: new Date().toISOString(),
        tool: '智能会议助手'
      }
    }
    
    const jsonFileHandle = await folderHandle.getFileHandle('会议数据.json', { create: true })
    const jsonWritable = await jsonFileHandle.createWritable()
    await jsonWritable.write(JSON.stringify(jsonData, null, 2))
    await jsonWritable.close()
    
    return {
      success: true,
      folderName: folderName,
      folderPath: folderHandle.name,
      filesSaved: 5
    }
    
  } catch (error) {
    console.error('保存录音失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 生成会议信息内容
function generateMeetingInfo(record) {
  const date = new Date(record.date)
  return `会议记录信息
================

会议标题：${record.title}
会议日期：${date.toLocaleString('zh-CN')}
会议时长：${record.duration} 秒

创建时间：${new Date().toLocaleString('zh-CN')}
导出工具：智能会议助手 v1.0
`
}

// 保存单个文件到指定路径
export async function saveFileToPath(filename, content, savePath) {
  try {
    if (!('showSaveFilePicker' in window)) {
      throw new Error('您的浏览器不支持文件系统访问API')
    }
    
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      startIn: savePath || 'downloads'
    })
    
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
    
    return {
      success: true,
      filename: filename
    }
    
  } catch (error) {
    console.error('保存文件失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 检查浏览器是否支持File System Access API
export function isFileSystemAccessSupported() {
  return 'showDirectoryPicker' in window && 'showSaveFilePicker' in window
}

// 获取浏览器支持信息
export function getFileSystemSupportInfo() {
  return {
    supported: isFileSystemAccessSupported(),
    showDirectoryPicker: 'showDirectoryPicker' in window,
    showSaveFilePicker: 'showSaveFilePicker' in window,
    browser: getBrowserName()
  }
}

// 获取浏览器名称
function getBrowserName() {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  return 'Unknown'
}