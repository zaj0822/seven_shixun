// 数据管理工具 - 支持导出和导入会议记录

// 导出所有会议记录到JSON文件
export function exportMeetingRecords() {
  try {
    const records = localStorage.getItem('meetingRecords')
    if (!records) {
      throw new Error('没有找到会议记录数据')
    }
    
    const parsedRecords = JSON.parse(records)
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      recordCount: parsedRecords.length,
      records: parsedRecords.map(record => ({
        ...record,
        // 移除音频数据的blob URL，因为无法导出
        audioData: null
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting_records_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    return {
      success: true,
      count: parsedRecords.length,
      filename: a.download
    }
  } catch (error) {
    console.error('导出失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 导入会议记录从JSON文件
export function importMeetingRecords(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.type !== 'application/json') {
      reject(new Error('请选择有效的JSON文件'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result)
        
        // 验证文件格式
        if (!importData.records || !Array.isArray(importData.records)) {
          throw new Error('文件格式不正确')
        }
        
        // 获取现有记录
        const existingRecords = JSON.parse(localStorage.getItem('meetingRecords') || '[]')
        
        // 合并记录（避免重复ID）
        const mergedRecords = [...existingRecords]
        const importedIds = new Set(existingRecords.map(r => r.id))
        
        let importedCount = 0
        importData.records.forEach(record => {
          if (!importedIds.has(record.id)) {
            mergedRecords.push({
              ...record,
              // 确保导入的记录有正确的日期格式
              date: record.date || new Date().toISOString()
            })
            importedIds.add(record.id)
            importedCount++
          }
        })
        
        // 按日期排序
        mergedRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
        
        // 保存到localStorage
        localStorage.setItem('meetingRecords', JSON.stringify(mergedRecords))
        
        resolve({
          success: true,
          importedCount: importedCount,
          totalCount: mergedRecords.length,
          duplicateCount: importData.records.length - importedCount
        })
        
      } catch (error) {
        reject(new Error(`导入失败: ${error.message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}

// 备份所有数据（会议记录 + 设置）
export function backupAllData() {
  try {
    const records = localStorage.getItem('meetingRecords')
    const settings = localStorage.getItem('meetingAssistantSettings')
    
    const backupData = {
      version: '1.0',
      backupDate: new Date().toISOString(),
      records: records ? JSON.parse(records) : [],
      settings: settings ? JSON.parse(settings) : {}
    }
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
      type: 'application/json;charset=utf-8' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting_assistant_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    return {
      success: true,
      recordCount: backupData.records.length,
      hasSettings: !!backupData.settings && Object.keys(backupData.settings).length > 0
    }
  } catch (error) {
    console.error('备份失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 恢复所有数据从备份文件
export function restoreFromBackup(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.type !== 'application/json') {
      reject(new Error('请选择有效的JSON备份文件'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result)
        
        // 验证备份文件格式
        if (!backupData.version || !backupData.backupDate) {
          throw new Error('无效的备份文件格式')
        }
        
        // 备份当前数据（以防需要恢复）
        const currentBackup = {
          records: localStorage.getItem('meetingRecords'),
          settings: localStorage.getItem('meetingAssistantSettings')
        }
        
        // 恢复数据
        if (backupData.records) {
          localStorage.setItem('meetingRecords', JSON.stringify(backupData.records))
        }
        
        if (backupData.settings) {
          localStorage.setItem('meetingAssistantSettings', JSON.stringify(backupData.settings))
        }
        
        resolve({
          success: true,
          recordsRestored: !!backupData.records,
          settingsRestored: !!backupData.settings,
          backupDate: backupData.backupDate,
          currentBackup: currentBackup // 提供当前数据的备份，以便需要时可以恢复
        })
        
      } catch (error) {
        reject(new Error(`恢复失败: ${error.message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}

// 获取数据统计信息
export function getDataStats() {
  try {
    const records = JSON.parse(localStorage.getItem('meetingRecords') || '[]')
    const settings = JSON.parse(localStorage.getItem('meetingAssistantSettings') || '{}')
    
    const totalDuration = records.reduce((sum, record) => sum + (record.duration || 0), 0)
    const keywordCount = records.reduce((sum, record) => sum + (record.keywords ? record.keywords.length : 0), 0)
    
    return {
      recordCount: records.length,
      totalDuration: totalDuration,
      averageDuration: records.length > 0 ? Math.round(totalDuration / records.length) : 0,
      keywordCount: keywordCount,
      hasSettings: Object.keys(settings).length > 0,
      lastRecordDate: records.length > 0 ? new Date(records[0].date).toLocaleDateString() : '无记录'
    }
  } catch (error) {
    console.error('获取数据统计失败:', error)
    return {
      error: error.message
    }
  }
}

// 清除所有数据
export function clearAllData() {
  try {
    localStorage.removeItem('meetingRecords')
    localStorage.removeItem('meetingAssistantSettings')
    
    return {
      success: true,
      message: '所有数据已清除'
    }
  } catch (error) {
    console.error('清除数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}