/**
 * Main Application Controller for English Proficiency Test (FİNAL VERSİYON)
 * Bitiş: 31 Ağustos 2025
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
        document.getElementById('startTestBtn').addEventListener('click', () => this.startTest());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('finishBtn').addEventListener('click', () => this.finishTest());
        document.getElementById('cancelExamBtn').addEventListener('click', () => this.cancelExam());
        document.getElementById('tryAgainBtn').addEventListener('click', () => this.restartTest());
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());
        document.getElementById('translateToTurkishBtn').addEventListener('click', () => this.translateToTurkish());
        document.getElementById('retryBtn').addEventListener('click', () => this.startTest());
        document.getElementById('backHomeBtn').addEventListener('click', () => this.goHome());
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    }

    /**
     * Belirli bir ekranı gösterir.
     */
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    /**
     * Testi başlatır.
     */
    async startTest() {
        try {
            this.showScreen('loadingScreen');
            this.updateLoadingProgress(0);
            this.updateLoadingText('Preparing Your Test', 'Our AI is generating personalized questions for you...');
            await this.testEngine.generateTest();
            this.updateLoadingProgress(100);
            setTimeout(() => this.showTestInterface(), 500);
        } catch (error) {
            console.error('Failed to start test:', error);
            if (this.testEngine.isOfflineMode) {
                this.showOfflineModeNotification();
                setTimeout(() => this.showTestInterface(), 2000);
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
        if (!options || !Array.isArray(options)) return;
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

        const accuracy = this.testResults.accuracy || 0;
        document.getElementById('finalScore').textContent = `${this.testResults.totalScore}/${this.testResults.totalQuestions}`;
        document.getElementById('proficiencyLevel').textContent = this.testResults.level;
        document.getElementById('accuracyPercentage').textContent = `${accuracy.toFixed(0)}%`;

        const report = this.testResults.learningReport;
        if (report && report.levelDescription) {
            document.getElementById('levelDescription').innerHTML = `<p>${report.levelDescription}</p>`;
            this.updateLearningReport(report);
        } else {
            document.getElementById('levelDescription').innerHTML = `<p class="text-danger">AI-powered detailed analysis could not be generated at this time. Please try again later.</p>`;
            document.getElementById('learningReport').innerHTML = '';
        }

        const grammarTotal = this.testResults.grammarResults.total || 0;
        const grammarCorrect = this.testResults.grammarResults.correct || 0;
        const grammarPercentage = grammarTotal > 0 ? (grammarCorrect / grammarTotal) * 100 : 0;
        document.getElementById('grammarProgress').style.width = `${grammarPercentage}%`;
        document.getElementById('grammarScore').textContent = `${grammarCorrect}/${grammarTotal} correct`;

        const readingTotal = this.testResults.readingResults.total || 0;
        const readingCorrect = this.testResults.readingResults.correct || 0;
        const readingPercentage = readingTotal > 0 ? (readingCorrect / readingTotal) * 100 : 0;
        document.getElementById('readingProgress').style.width = `${readingPercentage}%`;
        document.getElementById('readingScore').textContent = `${readingCorrect}/${readingTotal} correct`;
    }
    
    updateLearningReport(report) {
        const reportContainer = document.getElementById('learningReport');
        if (!report || !report.weakAreas) {
             reportContainer.innerHTML = '';
             return;
        }
        let reportHTML = '';
        if (report.strengths && report.strengths.length > 0) {
            reportHTML += `<div class="mb-4"><h6 class="text-success mb-3"><i class="fas fa-check-circle me-2"></i>Strengths</h6><ul class="list-unstyled">${report.strengths.map(s => `<li class="mb-1">✓ ${s}</li>`).join('')}</ul></div>`;
        }
        if (report.weakAreas && report.weakAreas.length > 0) {
            reportHTML += `<div class="mb-4"><h6 class="text-warning mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Areas for Improvement</h6>`;
            report.weakAreas.forEach(area => {
                reportHTML += `<div class.topic-analysis"><div class="topic-header"><span class="topic-name">${area.topic || 'General'}</span></div><p class="topic-explanation">${area.explanation || 'No specific explanation available.'}</p></div>`;
            });
            reportHTML += '</div>';
        }
        reportContainer.innerHTML = reportHTML;
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
            const translatedReport = await callApi('translateToTurkish', reportText);
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

    extractReportText() {
        const report = this.testResults.learningReport;
        if (!report) return '';
        let textContent = '';
        if (report.strengths && report.strengths.length > 0) {
            textContent += 'Strengths:\n' + report.strengths.join('\n') + '\n\n';
        }
        if (report.weakAreas && report.weakAreas.length > 0) {
            textContent += 'Areas for Improvement:\n';
            report.weakAreas.forEach(area => {
                textContent += `${area.topic}: ${area.explanation}\n`;
            });
        }
        return textContent;
    }

    formatTurkishReport(translatedData) {
        // ... (Bu fonksiyonu kendi orijinal kodundan alabilirsin)
        return "Türkçe rapor burada gösterilecek.";
    }

    showOfflineModeNotification() {
        this.updateLoadingText('Demo Mode Active', 'AI usage limit reached. A static demo test is being served.');
    }

    showAILimitedNotification() {
        const levelDesc = document.getElementById('levelDescription');
        if (levelDesc && (this.testResults.isAILimited || this.testResults.isOfflineMode)) {
           // ... (Bu fonksiyonu kendi orijinal kodundan alabilirsin)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new EnglishTestApp();
        console.log('English Proficiency Test App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});