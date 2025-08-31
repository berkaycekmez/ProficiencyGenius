/**
 * Main Application Controller for English Proficiency Test (FİNAL VERSİYON)
 * Artık doğrudan GeminiService'i değil, TestEngine aracılığıyla sunucuyu kullanır.
 */

class EnglishTestApp {
    constructor() {
        // Yeni mimariye uygun, doğru başlatma şekli
        this.evaluator = new Evaluator();
        this.testEngine = new TestEngine(this.evaluator);
        
        this.currentScreen = 'homepage';
        this.testResults = null;
        
        this.initializeEventListeners();
        this.showScreen('homepage');
    }

    /**
     * Tüm olay dinleyicilerini (event listener) başlatır.
     */
    initializeEventListeners() {
        // Homepage
        document.getElementById('startTestBtn').addEventListener('click', () => this.startTest());

        // Test navigation
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('finishBtn').addEventListener('click', () => this.finishTest());
        document.getElementById('cancelExamBtn').addEventListener('click', () => this.cancelExam());

        // Results screen
        document.getElementById('tryAgainBtn').addEventListener('click', () => this.restartTest());
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());
        document.getElementById('translateToTurkishBtn').addEventListener('click', () => this.translateToTurkish());

        // Error screen
        document.getElementById('retryBtn').addEventListener('click', () => this.startTest());
        document.getElementById('backHomeBtn').addEventListener('click', () => this.goHome());

        // Keyboard navigation - Düzeltilmiş hali
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    }

    /**
     * Show specific screen
     */
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    /**
     * Start the test
     */
    async startTest() {
        try {
            this.showScreen('loadingScreen');
            this.updateLoadingProgress(0);
            this.updateLoadingText('Preparing Your Test', 'Our AI is generating personalized questions for you...');
            await this.testEngine.generateTest();
            this.updateLoadingProgress(100);
            setTimeout(() => {
                this.showTestInterface();
            }, 500);
        } catch (error) {
            console.error('Failed to start test:', error);
            if (this.testEngine.isOfflineMode) {
                this.showOfflineModeNotification();
                setTimeout(() => {
                    this.showTestInterface();
                }, 2000);
            } else {
                this.showError('Failed to generate test questions. Please check your internet connection and try again.');
            }
        }
    }

    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) progressBar.style.width = `${percentage}%`;
    }

    updateLoadingText(title, message) {
        const titleEl = document.getElementById('loadingTitle');
        const messageEl = document.getElementById('loadingMessage');
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
    }

    showTestInterface() {
        this.showScreen('testScreen');
        this.updateTestInterface();
        this.updateNavigationButtons();
    }

    updateTestInterface() {
        const question = this.testEngine.getCurrentQuestion();
        if (!question) {
            this.finishTest();
            return;
        }
        const progress = this.testEngine.getProgress();
        document.getElementById('currentQuestionNum').textContent = progress.current;
        document.getElementById('totalQuestions').textContent = progress.total;
        document.getElementById('testProgress').style.width = `${progress.percentage}%`;
        document.getElementById('questionTypeBadge').textContent = question.type === 'grammar' ? 'Grammar' : 'Reading Comprehension';
        document.getElementById('difficultyBadge').textContent = question.level;
        const passageElement = document.getElementById('readingPassage');
        if (question.passage) {
            document.getElementById('passageText').textContent = question.passage;
            passageElement.style.display = 'block';
        } else {
            passageElement.style.display = 'none';
        }
        document.getElementById('questionText').textContent = question.question;
        this.updateOptions(question.options);
        const userAnswer = this.testEngine.getUserAnswer(this.testEngine.currentQuestionIndex);
        if (userAnswer !== null) {
            this.selectOption(userAnswer);
        }
    }

    updateOptions(options) {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'btn option-btn';
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            button.addEventListener('click', () => this.selectOption(index));
            container.appendChild(button);
        });
    }

    selectOption(optionIndex) {
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
        const optionBtns = document.querySelectorAll('.option-btn');
        if (optionBtns[optionIndex]) {
            optionBtns[optionIndex].classList.add('selected');
        }
        this.testEngine.answerQuestion(optionIndex);
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');
        const progress = this.testEngine.getProgress();
        const isAnswered = this.testEngine.isCurrentQuestionAnswered();
        const isLastQuestion = progress.current === progress.total;
        prevBtn.disabled = progress.current === 1;
        if (isLastQuestion) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
            finishBtn.disabled = !this.testEngine.isComplete();
        } else {
            nextBtn.style.display = 'inline-block';
            finishBtn.style.display = 'none';
            nextBtn.disabled = !isAnswered;
        }
    }

    nextQuestion() {
        if (this.testEngine.nextQuestion()) {
            this.updateTestInterface();
            this.updateNavigationButtons();
        }
    }

    previousQuestion() {
        if (this.testEngine.previousQuestion()) {
            this.updateTestInterface();
            this.updateNavigationButtons();
        }
    }

    async finishTest() {
        if (!this.testEngine.isComplete()) {
            alert('Please answer all questions before finishing the test.');
            return;
        }
        try {
            this.showScreen('loadingScreen');
            this.updateLoadingProgress(0);
            this.updateLoadingText('Preparing Your Report', 'Analyzing your answers...');
            this.testResults = await this.testEngine.finishTest();
            this.updateLoadingProgress(100);
            setTimeout(() => this.showResults(), 500);
        } catch (error) {
            console.error('Failed to finish test:', error);
            this.showError('Failed to calculate test results. Please try again.');
        }
    }

    showResults() {
        if (!this.testResults) return;
        this.showScreen('resultsScreen');
        document.getElementById('finalScore').textContent = `${this.testResults.totalScore}/${this.testResults.totalQuestions}`;
        document.getElementById('proficiencyLevel').textContent = this.testResults.level;
        document.getElementById('accuracyPercentage').textContent = `${this.testResults.accuracy}%`;
        if (!this.testResults.isOfflineMode && !this.testResults.isAILimited) {
            const levelDesc = document.getElementById('levelDescription');
            levelDesc.innerHTML = `<h6>${this.testResults.levelInfo.title}</h6><p>${this.testResults.levelInfo.description}</p>`;
        }
        this.showAILimitedNotification();
        const grammarPercentage = (this.testResults.grammarResults.correct / this.testResults.grammarResults.total) * 100;
        const readingPercentage = (this.testResults.readingResults.correct / this.testResults.readingResults.total) * 100;
        document.getElementById('grammarProgress').style.width = `${grammarPercentage}%`;
        document.getElementById('grammarScore').textContent = `${this.testResults.grammarResults.correct}/${this.testResults.grammarResults.total} correct`;
        document.getElementById('readingProgress').style.width = `${readingPercentage}%`;
        document.getElementById('readingScore').textContent = `${this.testResults.readingResults.correct}/${this.testResults.readingResults.total} correct`;
        this.updateLearningReport();
    }

    updateLearningReport() {
        const reportContainer = document.getElementById('learningReport');
        const report = this.testResults.learningReport;
        if (!report) {
            reportContainer.innerHTML = '<p class="text-muted">Learning report is not available.</p>';
            return;
        }
        let reportHTML = '';
        if (report.strengths && report.strengths.length > 0) {
            reportHTML += `<div class="mb-4"><h6 class="text-success mb-3"><i class="fas fa-check-circle me-2"></i>Strengths</h6><ul class="list-unstyled">${report.strengths.map(s => `<li class="mb-1">✓ ${s}</li>`).join('')}</ul></div>`;
        }
        if (report.weakAreas && report.weakAreas.length > 0) {
            reportHTML += `<div class="mb-4"><h6 class="text-warning mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Areas for Improvement</h6>`;
            report.weakAreas.forEach(area => {
                reportHTML += `<div class="topic-analysis"><div class="topic-header"><span class="topic-name">${area.topic}</span><span class="topic-score ${area.performance}">${area.performance}</span></div><p class="topic-explanation">${area.explanation}</p>${area.recommendations ? `<ul class="mt-2">${area.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}</div>`;
            });
            reportHTML += '</div>';
        }
        // ... (Kalan rapor oluşturma mantığı)
        reportContainer.innerHTML = reportHTML || '<p class="text-muted">No detailed analysis available.</p>';
    }

    restartTest() {
        this.testResults = null;
        this.startTest();
    }

    goHome() {
        this.testResults = null;
        this.testEngine.reset();
        this.showScreen('homepage');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showScreen('errorScreen');
    }

    // --- EKSİK OLAN VE HATAYA SEBEP OLAN FONKSİYON BURADA ---
    handleKeyboardNavigation(event) {
        if (this.currentScreen !== 'testScreen') return;
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                if (!document.getElementById('prevBtn').disabled) this.previousQuestion();
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (!document.getElementById('nextBtn').disabled) this.nextQuestion();
                break;
            case '1': case 'a': case 'A': event.preventDefault(); this.selectOption(0); break;
            case '2': case 'b': case 'B': event.preventDefault(); this.selectOption(1); break;
            case '3': case 'c': case 'C': event.preventDefault(); this.selectOption(2); break;
            case '4': case 'd': case 'D': event.preventDefault(); this.selectOption(3); break;
        }
    }

    cancelExam() {
        const confirmed = confirm('Are you sure you want to cancel the exam? Your progress will be lost.');
        if (confirmed) {
            this.testEngine.reset();
            this.testResults = null;
            this.goHome();
        }
    }

    async translateToTurkish() {
        const englishReport = document.getElementById('learningReport');
        const turkishReport = document.getElementById('turkishLearningReport');
        const translateBtn = document.getElementById('translateToTurkishBtn');
        try {
            if (turkishReport.style.display === 'block') {
                englishReport.style.display = 'block';
                turkishReport.style.display = 'none';
                translateBtn.innerHTML = '<i class="fas fa-language me-1"></i>Türkçe Görüntüle';
                return;
            }
            translateBtn.disabled = true;
            translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Çevriliyor...';
            const reportText = this.extractReportText();
            const translatedReport = await callApi('translateToTurkish', reportText); // YENİ YAPI
            turkishReport.innerHTML = this.formatTurkishReport(translatedReport);
            englishReport.style.display = 'none';
            turkishReport.style.display = 'block';
            translateBtn.innerHTML = '<i class="fas fa-language me-1"></i>View in English';
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Çeviri sırasında bir hata oluştu.');
        } finally {
            translateBtn.disabled = false;
        }
    }

    extractReportText() { /* ... (içeriği aynı) ... */ }
    formatTurkishReport(translatedData) { /* ... (içeriği aynı) ... */ }
    showOfflineModeNotification() { /* ... (içeriği aynı) ... */ }
    showAILimitedNotification() { /* ... (içeriği aynı) ... */ }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new EnglishTestApp();
        console.log('English Proficiency Test App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});