class VideoTranscriber {
    constructor() {
        this.currentTaskId = null;
        this.eventSource = null;
        this.apiBase = 'http://localhost:8000/api';
        this.currentLanguage = 'en'; // 默认英文
        
        // 智能进度模拟相关
        this.smartProgress = {
            enabled: false,
            current: 0,           // 当前显示的进度
            target: 0,            // 目标进度
            lastServerUpdate: 0,  // 最后一次服务器更新的进度
            interval: null,       // 定时器
            estimatedDuration: 0, // 预估总时长（秒）
            startTime: null,      // 任务开始时间
            stage: 'preparing'    // 当前阶段
        };
        
        this.translations = {
            en: {
                title: "AI Video Transcriber",
                subtitle: "Supports automatic transcription and AI summary for YouTube, Tiktok, Bilibili and other platforms",
                video_url: "Video URL",
                video_url_placeholder: "Enter YouTube, Tiktok, Bilibili or other platform video URLs...",
                summary_language: "Summary Language",
                start_transcription: "Start",
                processing_progress: "Processing Progress",
                preparing: "Preparing...",
                transcription_results: "Results",
                download_transcript: "Download Transcript",
                download_summary: "Download Summary",
                transcript_text: "Transcript Text",
                intelligent_summary: "AI Summary",
                footer_text: "Powered by AI, supports multi-platform video transcription",
                processing: "Processing...",
                downloading_video: "Downloading video...",
                parsing_video: "Parsing video info...",
                transcribing_audio: "Transcribing audio...",
                optimizing_transcript: "Optimizing transcript...",
                generating_summary: "Generating summary...",
                completed: "Processing completed!",
                error_invalid_url: "Please enter a valid video URL",
                error_processing_failed: "Processing failed: ",
                error_task_not_found: "Task not found",
                error_task_not_completed: "Task not completed yet",
                error_invalid_file_type: "Invalid file type",
                error_file_not_found: "File not found",
                error_download_failed: "Download failed: ",
                error_no_file_to_download: "No file available for download"
            },
            zh: {
                title: "AI视频转录器",
                subtitle: "支持YouTube、Tiktok、Bilibili等平台的视频自动转录和智能摘要",
                video_url: "视频链接",
                video_url_placeholder: "请输入YouTube、Tiktok、Bilibili等平台的视频链接...",
                summary_language: "摘要语言",
                start_transcription: "开始转录",
                processing_progress: "处理进度",
                preparing: "准备中...",
                transcription_results: "转录结果",
                download_transcript: "下载转录",
                download_summary: "下载摘要",
                transcript_text: "转录文本",
                intelligent_summary: "智能摘要",
                footer_text: "由AI驱动，支持多平台视频转录",
                processing: "处理中...",
                downloading_video: "正在下载视频...",
                parsing_video: "正在解析视频信息...",
                transcribing_audio: "正在转录音频...",
                optimizing_transcript: "正在优化转录文本...",
                generating_summary: "正在生成摘要...",
                completed: "处理完成！",
                error_invalid_url: "请输入有效的视频链接",
                error_processing_failed: "处理失败: ",
                error_task_not_found: "任务不存在",
                error_task_not_completed: "任务尚未完成",
                error_invalid_file_type: "无效的文件类型",
                error_file_not_found: "文件不存在",
                error_download_failed: "下载文件失败: ",
                error_no_file_to_download: "没有可下载的文件"
            }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.initializeLanguage();
    }
    
    initializeElements() {
        // 表单元素
        this.form = document.getElementById('videoForm');
        this.videoUrlInput = document.getElementById('videoUrl');
        this.summaryLanguageSelect = document.getElementById('summaryLanguage');
        this.submitBtn = document.getElementById('submitBtn');
        
        // 进度元素
        this.progressSection = document.getElementById('progressSection');
        this.progressStatus = document.getElementById('progressStatus');
        this.progressFill = document.getElementById('progressFill');
        this.progressMessage = document.getElementById('progressMessage');
        
        // 错误提示
        this.errorAlert = document.getElementById('errorAlert');
        this.errorMessage = document.getElementById('errorMessage');
        
        // 结果元素
        this.resultsSection = document.getElementById('resultsSection');
        this.scriptContent = document.getElementById('scriptContent');
        this.summaryContent = document.getElementById('summaryContent');
        this.downloadScriptBtn = document.getElementById('downloadScript');
        this.downloadSummaryBtn = document.getElementById('downloadSummary');
        
        // 标签页
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 语言切换按钮
        this.langToggle = document.getElementById('langToggle');
        this.langText = document.getElementById('langText');
    }
    
    bindEvents() {
        // 表单提交
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startTranscription();
        });
        
        // 标签页切换
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
        
        // 下载按钮
        this.downloadScriptBtn.addEventListener('click', () => {
            this.downloadFile('script');
        });
        
        this.downloadSummaryBtn.addEventListener('click', () => {
            this.downloadFile('summary');
        });
        
        // 语言切换按钮
        this.langToggle.addEventListener('click', () => {
            this.toggleLanguage();
        });
    }
    
    initializeLanguage() {
        // 设置默认语言为英文
        this.switchLanguage('en');
    }
    
    toggleLanguage() {
        // 切换语言
        this.currentLanguage = this.currentLanguage === 'en' ? 'zh' : 'en';
        this.switchLanguage(this.currentLanguage);
    }
    
    switchLanguage(lang) {
        this.currentLanguage = lang;
        
        // 更新语言按钮文本 - 显示当前语言
        this.langText.textContent = lang === 'en' ? 'English' : '中文';
        
        // 更新页面文本
        this.updatePageText();
        
        // 更新HTML lang属性
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        
        // 更新页面标题
        document.title = this.t('title');
    }
    
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    }
    
    updatePageText() {
        // 更新所有带有data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // 更新placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
    }
    
    async startTranscription() {
        // 立即禁用按钮，防止重复点击
        if (this.submitBtn.disabled) {
            return; // 如果按钮已禁用，直接返回
        }
        
        const videoUrl = this.videoUrlInput.value.trim();
        const summaryLanguage = this.summaryLanguageSelect.value;
        
        if (!videoUrl) {
            this.showError(this.t('error_invalid_url'));
            return;
        }
        
        try {
            // 立即禁用按钮和隐藏错误
            this.setLoading(true);
            this.hideError();
            this.hideResults();
            this.showProgress();
            
            // 发送转录请求
            const formData = new FormData();
            formData.append('url', videoUrl);
            formData.append('summary_language', summaryLanguage);
            
            const response = await fetch(`${this.apiBase}/process-video`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '请求失败');
            }
            
            const data = await response.json();
            this.currentTaskId = data.task_id;
            
            console.log('[DEBUG] ✅ 任务已创建，Task ID:', this.currentTaskId);
            
            // 启动智能进度模拟
            this.initializeSmartProgress();
            this.updateProgress(5, this.t('preparing'), true);
            
            // 使用SSE实时接收状态更新
            this.startSSE();
            
        } catch (error) {
            console.error('启动转录失败:', error);
            this.showError(this.t('error_processing_failed') + error.message);
            this.setLoading(false);
            this.hideProgress();
        }
    }
    
    startSSE() {
        if (!this.currentTaskId) return;
        
        console.log('[DEBUG] 🔄 启动SSE连接，Task ID:', this.currentTaskId);
        
        // 创建EventSource连接
        this.eventSource = new EventSource(`${this.apiBase}/task-stream/${this.currentTaskId}`);
        
        this.eventSource.onmessage = (event) => {
            try {
                const task = JSON.parse(event.data);
                
                // 忽略心跳消息
                if (task.type === 'heartbeat') {
                    console.log('[DEBUG] 💓 收到心跳');
                    return;
                }
                
                console.log('[DEBUG] 📊 收到SSE任务状态:', {
                    status: task.status,
                    progress: task.progress,
                    message: task.message
                });
                
                // 更新进度 (标记为服务器推送)
                console.log('[DEBUG] 📈 更新进度条:', `${task.progress}% - ${task.message}`);
                this.updateProgress(task.progress, task.message, true);
                
                if (task.status === 'completed') {
                    console.log('[DEBUG] ✅ 任务完成，显示结果');
                    this.stopSmartProgress(); // 停止智能进度模拟
                    this.stopSSE();
                    this.setLoading(false);
                    this.hideProgress();
                    this.showResults(task.script, task.summary, task.video_title);
                } else if (task.status === 'error') {
                    console.log('[DEBUG] ❌ 任务失败:', task.error);
                    this.stopSmartProgress(); // 停止智能进度模拟
                    this.stopSSE();
                    this.setLoading(false);
                    this.hideProgress();
                    this.showError(task.error || '处理过程中发生错误');
                }
            } catch (error) {
                console.error('[DEBUG] 解析SSE数据失败:', error);
            }
        };
        
        this.eventSource.onerror = (error) => {
            console.error('[DEBUG] SSE连接错误:', error);
            this.stopSSE();
            this.showError(this.t('error_processing_failed') + 'SSE连接断开');
            this.setLoading(false);
        };
        
        this.eventSource.onopen = () => {
            console.log('[DEBUG] 🔗 SSE连接已建立');
        };
    }
    
    stopSSE() {
        if (this.eventSource) {
            console.log('[DEBUG] 🔌 关闭SSE连接');
            this.eventSource.close();
            this.eventSource = null;
        }
    }
    

    
    updateProgress(progress, message, fromServer = false) {
        console.log('[DEBUG] 🎯 updateProgress调用:', { progress, message, fromServer });
        
        if (fromServer) {
            // 服务器推送的真实进度
            this.handleServerProgress(progress, message);
        } else {
            // 本地模拟进度
            this.updateProgressDisplay(progress, message);
        }
    }
    
    handleServerProgress(serverProgress, message) {
        console.log('[DEBUG] 📡 处理服务器进度:', serverProgress);
        
        // 停止当前的模拟进度
        this.stopSmartProgress();
        
        // 更新服务器进度记录
        this.smartProgress.lastServerUpdate = serverProgress;
        this.smartProgress.current = serverProgress;
        
        // 立即显示服务器进度
        this.updateProgressDisplay(serverProgress, message);
        
        // 确定当前处理阶段和预估目标
        this.updateProgressStage(serverProgress, message);
        
        // 重新启动智能进度模拟
        this.startSmartProgress();
    }
    
    updateProgressStage(progress, message) {
        // 根据进度和消息确定处理阶段
        if (message.includes('解析') || message.includes('parsing')) {
            this.smartProgress.stage = 'parsing';
            this.smartProgress.target = 25;
        } else if (message.includes('下载') || message.includes('downloading')) {
            this.smartProgress.stage = 'downloading';
            this.smartProgress.target = 60;
        } else if (message.includes('转录') || message.includes('transcrib')) {
            this.smartProgress.stage = 'transcribing';
            this.smartProgress.target = 80;
        } else if (message.includes('优化') || message.includes('optimiz')) {
            this.smartProgress.stage = 'optimizing';
            this.smartProgress.target = 90;
        } else if (message.includes('摘要') || message.includes('summary')) {
            this.smartProgress.stage = 'summarizing';
            this.smartProgress.target = 95;
        } else if (message.includes('完成') || message.includes('completed')) {
            this.smartProgress.stage = 'completed';
            this.smartProgress.target = 100;
        }
        
        // 如果当前进度超过预设目标，调整目标
        if (progress >= this.smartProgress.target) {
            this.smartProgress.target = Math.min(progress + 10, 100);
        }
        
        console.log('[DEBUG] 🎯 阶段更新:', {
            stage: this.smartProgress.stage,
            target: this.smartProgress.target,
            current: progress
        });
    }
    
    initializeSmartProgress() {
        // 初始化智能进度状态
        this.smartProgress.enabled = false;
        this.smartProgress.current = 0;
        this.smartProgress.target = 15;
        this.smartProgress.lastServerUpdate = 0;
        this.smartProgress.startTime = Date.now();
        this.smartProgress.stage = 'preparing';
        
        console.log('[DEBUG] 🔧 智能进度模拟已初始化');
    }
    
    startSmartProgress() {
        // 启动智能进度模拟
        if (this.smartProgress.interval) {
            clearInterval(this.smartProgress.interval);
        }
        
        this.smartProgress.enabled = true;
        this.smartProgress.startTime = this.smartProgress.startTime || Date.now();
        
        // 每500ms更新一次模拟进度
        this.smartProgress.interval = setInterval(() => {
            this.simulateProgress();
        }, 500);
        
        console.log('[DEBUG] 🚀 智能进度模拟已启动');
    }
    
    stopSmartProgress() {
        if (this.smartProgress.interval) {
            clearInterval(this.smartProgress.interval);
            this.smartProgress.interval = null;
        }
        this.smartProgress.enabled = false;
        console.log('[DEBUG] ⏹️ 智能进度模拟已停止');
    }
    
    simulateProgress() {
        if (!this.smartProgress.enabled) return;
        
        const current = this.smartProgress.current;
        const target = this.smartProgress.target;
        
        // 如果已经达到目标，暂停模拟
        if (current >= target) return;
        
        // 计算进度增量（基于阶段的不同速度）
        let increment = this.calculateProgressIncrement();
        
        // 确保不超过目标进度
        const newProgress = Math.min(current + increment, target);
        
        if (newProgress > current) {
            this.smartProgress.current = newProgress;
            this.updateProgressDisplay(newProgress, this.getCurrentStageMessage());
        }
    }
    
    calculateProgressIncrement() {
        const elapsedTime = (Date.now() - this.smartProgress.startTime) / 1000; // 秒
        
        // 基于不同阶段的预估速度
        const stageConfig = {
            'parsing': { speed: 0.3, maxTime: 30 },      // 解析阶段：30秒内到25%
            'downloading': { speed: 0.2, maxTime: 120 }, // 下载阶段：2分钟内到60%
            'transcribing': { speed: 0.15, maxTime: 180 }, // 转录阶段：3分钟内到80%
            'optimizing': { speed: 0.25, maxTime: 60 },  // 优化阶段：1分钟内到90%
            'summarizing': { speed: 0.3, maxTime: 30 }   // 摘要阶段：30秒内到95%
        };
        
        const config = stageConfig[this.smartProgress.stage] || { speed: 0.2, maxTime: 60 };
        
        // 基础增量：每500ms增加的百分比
        let baseIncrement = config.speed;
        
        // 时间因子：如果时间过长，加快进度
        if (elapsedTime > config.maxTime) {
            baseIncrement *= 1.5;
        }
        
        // 距离因子：距离目标越近，速度越慢
        const remaining = this.smartProgress.target - this.smartProgress.current;
        if (remaining < 5) {
            baseIncrement *= 0.3; // 接近目标时放慢
        }
        
        return baseIncrement;
    }
    
    getCurrentStageMessage() {
        const stageMessages = {
            'parsing': this.t('parsing_video'),
            'downloading': this.t('downloading_video'),
            'transcribing': this.t('transcribing_audio'),
            'optimizing': this.t('optimizing_transcript'),
            'summarizing': this.t('generating_summary'),
            'completed': this.t('completed')
        };
        
        return stageMessages[this.smartProgress.stage] || this.t('processing');
    }
    
    updateProgressDisplay(progress, message) {
        // 实际更新UI显示
        const roundedProgress = Math.round(progress * 10) / 10; // 保留1位小数
        this.progressStatus.textContent = `${roundedProgress}%`;
        this.progressFill.style.width = `${roundedProgress}%`;
        console.log('[DEBUG] 📏 进度条已更新:', this.progressFill.style.width);
        
        // 翻译常见的进度消息
        let translatedMessage = message;
        if (message.includes('下载视频') || message.includes('downloading') || message.includes('Downloading')) {
            translatedMessage = this.t('downloading_video');
        } else if (message.includes('解析视频') || message.includes('parsing') || message.includes('Parsing')) {
            translatedMessage = this.t('parsing_video');
        } else if (message.includes('转录') || message.includes('transcrib') || message.includes('Transcrib')) {
            translatedMessage = this.t('transcribing_audio');
        } else if (message.includes('优化转录') || message.includes('optimizing') || message.includes('Optimizing')) {
            translatedMessage = this.t('optimizing_transcript');
        } else if (message.includes('摘要') || message.includes('summary') || message.includes('Summary')) {
            translatedMessage = this.t('generating_summary');
        } else if (message.includes('完成') || message.includes('complet') || message.includes('Complet')) {
            translatedMessage = this.t('completed');
        } else if (message.includes('准备') || message.includes('prepar') || message.includes('Prepar')) {
            translatedMessage = this.t('preparing');
        }
        
        this.progressMessage.textContent = translatedMessage;
    }
    
    showProgress() {
        this.progressSection.style.display = 'block';
    }
    
    hideProgress() {
        this.progressSection.style.display = 'none';
    }
    
    showResults(script, summary, videoTitle = null) {

        // 渲染markdown内容
        this.scriptContent.innerHTML = marked.parse(script || '');
        this.summaryContent.innerHTML = marked.parse(summary || '');
        
        // 显示结果区域
        this.resultsSection.style.display = 'block';
        
        // 滚动到结果区域
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // 高亮代码
        if (window.Prism) {
            Prism.highlightAll();
        }
    }
    
    hideResults() {
        this.resultsSection.style.display = 'none';
    }
    
    switchTab(tabName) {
        // 移除所有活动状态
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // 激活选中的标签页
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}Tab`);
        
        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
        }
    }
    
    async downloadFile(fileType) {
        if (!this.currentTaskId) {
            this.showError(this.t('error_no_file_to_download'));
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/download/${this.currentTaskId}/${fileType}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '下载失败');
            }
            
            // 获取文件名
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `${fileType}.md`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // 下载文件
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('下载文件失败:', error);
            this.showError(this.t('error_download_failed') + error.message);
        }
    }
    
    setLoading(loading) {
        this.submitBtn.disabled = loading;
        
        if (loading) {
            this.submitBtn.innerHTML = `<div class="loading-spinner"></div> ${this.t('processing')}`;
        } else {
            this.submitBtn.innerHTML = `<i class="fas fa-play"></i> ${this.t('start_transcription')}`;
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorAlert.style.display = 'block';
        
        // 滚动到错误提示
        this.errorAlert.scrollIntoView({ behavior: 'smooth' });
        
        // 5秒后自动隐藏错误提示
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        this.errorAlert.style.display = 'none';
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.transcriber = new VideoTranscriber();
    
    // 添加一些示例链接提示
    const urlInput = document.getElementById('videoUrl');
    urlInput.addEventListener('focus', () => {
        if (!urlInput.value) {
            urlInput.placeholder = '例如: https://www.youtube.com/watch?v=... 或 https://www.bilibili.com/video/...';
        }
    });
    
    urlInput.addEventListener('blur', () => {
        if (!urlInput.value) {
            urlInput.placeholder = '请输入YouTube、Bilibili等平台的视频链接...';
        }
    });
});

// 处理页面刷新时的清理工作
window.addEventListener('beforeunload', () => {
    if (window.transcriber && window.transcriber.eventSource) {
        window.transcriber.stopSSE();
    }
});
