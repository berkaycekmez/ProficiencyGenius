/**
 * Main Application Controller for English Proficiency Test
 * Orchestrates the entire test flow and user interface
 */

class EnglishTestApp {
    constructor() {
        this.geminiService = new GeminiService();
        this.evaluator = new Evaluator();
        this.testEngine = new TestEngine(this.geminiService, this.evaluator);
        
        this.currentScreen = 'homepage';
        this.testResults = null;
        
        this.initializeEventListeners();
        this.showScreen('homepage');
    }

    /**
     * Initialize all event listeners
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

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    /**
     * Show specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
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

            // Reset test state
            this.testEngine.reset();
            
            // Generate test questions
            this.updateLoadingProgress(20);
            await this.testEngine.generateTest();
            
            this.updateLoadingProgress(100);
            
            // Short delay to show completion
            setTimeout(() => {
                this.showTestInterface();
            }, 500);

        } catch (error) {
            console.error('Failed to start test:', error);
            
            // Check if we're in offline mode after the error
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

    /**
     * Update loading progress
     */
    updateLoadingProgress(percentage) {
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    /**
     * Update loading screen text
     */
    updateLoadingText(title, message) {
        const titleEl = document.getElementById('loadingTitle');
        const messageEl = document.getElementById('loadingMessage');
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
    }

    /**
     * Show test interface
     */
    showTestInterface() {
        this.showScreen('testScreen');
        this.updateTestInterface();
        this.updateNavigationButtons();
    }

    /**
     * Update test interface with current question
     */
    updateTestInterface() {
        const question = this.testEngine.getCurrentQuestion();
        if (!question) {
            this.finishTest();
            return;
        }

        const progress = this.testEngine.getProgress();
        
        // Update progress indicators
        document.getElementById('currentQuestionNum').textContent = progress.current;
        document.getElementById('totalQuestions').textContent = progress.total;
        document.getElementById('testProgress').style.width = `${progress.percentage}%`;

        // Update question type and difficulty badges
        document.getElementById('questionTypeBadge').textContent = 
            question.type === 'grammar' ? 'Grammar' : 'Reading Comprehension';
        document.getElementById('difficultyBadge').textContent = question.level;

        // Handle reading passage
        const passageElement = document.getElementById('readingPassage');
        if (question.passage) {
            document.getElementById('passageText').textContent = question.passage;
            passageElement.style.display = 'block';
        } else {
            passageElement.style.display = 'none';
        }

        // Update question text
        document.getElementById('questionText').textContent = question.question;

        // Update options
        this.updateOptions(question.options);
        
        // Restore previous answer if any
        const userAnswer = this.testEngine.getUserAnswer(this.testEngine.currentQuestionIndex);
        if (userAnswer !== null) {
            this.selectOption(userAnswer);
        }
    }

    /**
     * Update multiple choice options
     */
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

    /**
     * Select an option
     */
    selectOption(optionIndex) {
        // Remove previous selection
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selection to clicked option
        const optionBtns = document.querySelectorAll('.option-btn');
        if (optionBtns[optionIndex]) {
            optionBtns[optionIndex].classList.add('selected');
        }

        // Record answer
        this.testEngine.answerQuestion(optionIndex);
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    /**
     * Update navigation buttons state
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');

        const progress = this.testEngine.getProgress();
        const isAnswered = this.testEngine.isCurrentQuestionAnswered();
        const isLastQuestion = progress.current === progress.total;

        // Previous button
        prevBtn.disabled = progress.current === 1;

        // Next/Finish buttons
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

    /**
     * Navigate to next question
     */
    nextQuestion() {
        if (this.testEngine.nextQuestion()) {
            this.updateTestInterface();
            this.updateNavigationButtons();
        }
    }

    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.testEngine.previousQuestion()) {
            this.updateTestInterface();
            this.updateNavigationButtons();
        }
    }

    /**
     * Finish the test
     */
    async finishTest() {
        if (!this.testEngine.isComplete()) {
            this.showError('Please answer all questions before finishing the test.');
            return;
        }

        try {
            this.showScreen('loadingScreen');
            this.updateLoadingProgress(0);
            this.updateLoadingText('Preparing Your Report', 'Analyzing your answers and generating detailed feedback...');

            // Calculate results
            this.updateLoadingProgress(50);
            this.testResults = await this.testEngine.finishTest();
            
            this.updateLoadingProgress(100);
            
            // Show results
            setTimeout(() => {
                this.showResults();
            }, 500);

        } catch (error) {
            console.error('Failed to finish test:', error);
            this.showError('Failed to calculate test results. Please try again.');
        }
    }

    /**
     * Show test results
     */
    showResults() {
        if (!this.testResults) return;

        this.showScreen('resultsScreen');

        // Update score summary
        document.getElementById('finalScore').textContent = 
            `${this.testResults.totalScore}/${this.testResults.totalQuestions}`;
        document.getElementById('proficiencyLevel').textContent = this.testResults.level;
        document.getElementById('accuracyPercentage').textContent = `${this.testResults.accuracy}%`;

        // Update level description and show appropriate notifications
        if (!this.testResults.isOfflineMode && !this.testResults.isAILimited) {
            // Normal AI mode - show standard level description
            const levelDesc = document.getElementById('levelDescription');
            levelDesc.innerHTML = `
                <h6>${this.testResults.levelInfo.title}</h6>
                <p>${this.testResults.levelInfo.description}</p>
            `;
        }
        this.showAILimitedNotification();

        // Update performance analysis
        const grammarPercentage = (this.testResults.grammarResults.correct / this.testResults.grammarResults.total) * 100;
        const readingPercentage = (this.testResults.readingResults.correct / this.testResults.readingResults.total) * 100;

        document.getElementById('grammarProgress').style.width = `${grammarPercentage}%`;
        document.getElementById('grammarScore').textContent = 
            `${this.testResults.grammarResults.correct}/${this.testResults.grammarResults.total} correct`;

        document.getElementById('readingProgress').style.width = `${readingPercentage}%`;
        document.getElementById('readingScore').textContent = 
            `${this.testResults.readingResults.correct}/${this.testResults.readingResults.total} correct`;

        // Update learning report
        this.updateLearningReport();
    }

    /**
     * Update learning report section
     */
    updateLearningReport() {
        const reportContainer = document.getElementById('learningReport');
        const report = this.testResults.learningReport;

        if (!report) {
            reportContainer.innerHTML = '<p class="text-muted">Learning report is not available.</p>';
            return;
        }

        let reportHTML = '';

        // Strengths
        if (report.strengths && report.strengths.length > 0) {
            reportHTML += `
                <div class="mb-4">
                    <h6 class="text-success mb-3"><i class="fas fa-check-circle me-2"></i>Strengths</h6>
                    <ul class="list-unstyled">
                        ${report.strengths.map(strength => `<li class="mb-1">✓ ${strength}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Weak areas
        if (report.weakAreas && report.weakAreas.length > 0) {
            reportHTML += `
                <div class="mb-4">
                    <h6 class="text-warning mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Areas for Improvement</h6>
            `;
            
            report.weakAreas.forEach(area => {
                reportHTML += `
                    <div class="topic-analysis">
                        <div class="topic-header">
                            <span class="topic-name">${area.topic}</span>
                            <span class="topic-score ${area.performance}">${area.performance}</span>
                        </div>
                        <p class="topic-explanation">${area.explanation}</p>
                        ${area.recommendations ? `
                            <ul class="mt-2">
                                ${area.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `;
            });
            
            reportHTML += '</div>';
        }

        // Overall recommendations
        if (report.overallRecommendations && report.overallRecommendations.length > 0) {
            reportHTML += `
                <div class="mb-4">
                    <h6 class="text-primary mb-3"><i class="fas fa-lightbulb me-2"></i>Study Recommendations</h6>
                    <ul>
                        ${report.overallRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Next steps
        if (report.nextSteps && report.nextSteps.length > 0) {
            reportHTML += `
                <div>
                    <h6 class="text-info mb-3"><i class="fas fa-arrow-right me-2"></i>Next Steps</h6>
                    <ol>
                        ${report.nextSteps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            `;
        }

        reportContainer.innerHTML = reportHTML || '<p class="text-muted">No detailed analysis available.</p>';
    }

    /**
     * Restart the test
     */
    restartTest() {
        this.testResults = null;
        this.startTest();
    }

    /**
     * Go back to homepage
     */
    goHome() {
        this.testResults = null;
        this.testEngine.reset();
        this.showScreen('homepage');
    }

    /**
     * Show error message
     */
    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.showScreen('errorScreen');
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboardNavigation(event) {
        if (this.currentScreen !== 'testScreen') return;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                if (!document.getElementById('prevBtn').disabled) {
                    this.previousQuestion();
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (!document.getElementById('nextBtn').disabled) {
                    this.nextQuestion();
                }
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                event.preventDefault();
                const optionIndex = parseInt(event.key) - 1;
                const optionBtns = document.querySelectorAll('.option-btn');
                if (optionBtns[optionIndex]) {
                    this.selectOption(optionIndex);
                }
                break;
            case 'a':
            case 'A':
                event.preventDefault();
                this.selectOption(0);
                break;
            case 'b':
            case 'B':
                event.preventDefault();
                this.selectOption(1);
                break;
            case 'c':
            case 'C':
                event.preventDefault();
                this.selectOption(2);
                break;
            case 'd':
            case 'D':
                event.preventDefault();
                this.selectOption(3);
                break;
        }
    }

    /**
     * Cancel exam with confirmation
     */
    cancelExam() {
        const confirmed = confirm('Are you sure you want to cancel the exam? Your progress will be lost.');
        if (confirmed) {
            this.testEngine.reset();
            this.testResults = null;
            this.goHome();
        }
    }

    /**
     * Translate learning report to Turkish
     */
    async translateToTurkish() {
        const englishReport = document.getElementById('learningReport');
        const turkishReport = document.getElementById('turkishLearningReport');
        const translateBtn = document.getElementById('translateToTurkishBtn');

        try {
            // Check if already translated
            if (turkishReport.style.display === 'block') {
                // Toggle back to English
                englishReport.style.display = 'block';
                turkishReport.style.display = 'none';
                translateBtn.innerHTML = '<i class="fas fa-language me-1"></i>Türkçe Görüntüle';
                return;
            }

            // Show loading state
            translateBtn.disabled = true;
            translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Çevriliyor...';

            // Get the learning report content
            const reportText = this.extractReportText();
            
            // Translate using Gemini
            const translatedReport = await this.geminiService.translateToTurkish(reportText);
            
            // Display Turkish version
            turkishReport.innerHTML = this.formatTurkishReport(translatedReport);
            englishReport.style.display = 'none';
            turkishReport.style.display = 'block';
            
            // Update button
            translateBtn.innerHTML = '<i class="fas fa-language me-1"></i>View in English';
            
        } catch (error) {
            console.error('Translation failed:', error);
            alert('Çeviri sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            translateBtn.disabled = false;
        }
    }

    /**
     * Extract text content from learning report for translation
     */
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
                if (area.recommendations) {
                    textContent += 'Recommendations: ' + area.recommendations.join(', ') + '\n';
                }
                textContent += '\n';
            });
        }
        
        if (report.overallRecommendations && report.overallRecommendations.length > 0) {
            textContent += 'Study Recommendations:\n' + report.overallRecommendations.join('\n') + '\n\n';
        }
        
        if (report.nextSteps && report.nextSteps.length > 0) {
            textContent += 'Next Steps:\n' + report.nextSteps.join('\n');
        }

        return textContent;
    }

    /**
     * Format Turkish translation for display
     */
    formatTurkishReport(translatedData) {
        if (!translatedData) return '<p class="text-muted">Çeviri mevcut değil.</p>';

        let reportHTML = '';

        // Strengths
        if (translatedData.strengths && translatedData.strengths.length > 0) {
            reportHTML += `
                <div class="mb-4">
                    <h6 class="text-success mb-3"><i class="fas fa-check-circle me-2"></i>Güçlü Yönler</h6>
                    <ul class="list-unstyled">
                        ${translatedData.strengths.map(strength => `<li class="mb-1">✓ ${strength}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Weak areas
        if (translatedData.weakAreas && translatedData.weakAreas.length > 0) {
            reportHTML += `
                <div class="mb-4">
                    <h6 class="text-warning mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Geliştirilmesi Gereken Alanlar</h6>
            `;
            
            translatedData.weakAreas.forEach(area => {
                reportHTML += `
                    <div class="topic-analysis">
                        <div class="topic-header">
                            <span class="topic-name">${area.topic}</span>
                            <span class="topic-score ${area.performance}">${area.performance}</span>
                        </div>
                        <p class="topic-explanation">${area.explanation}</p>
                        ${area.recommendations ? `
                            <ul class="mt-2">
                                ${area.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `;
            });
            
            reportHTML += '</div>';
        }

        // Overall recommendations
        if (translatedData.overallRecommendations && translatedData.overallRecommendations.length > 0) {
            reportHTML += `
                <div class="mb-4">
                    <h6 class="text-primary mb-3"><i class="fas fa-lightbulb me-2"></i>Çalışma Önerileri</h6>
                    <ul>
                        ${translatedData.overallRecommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Next steps
        if (translatedData.nextSteps && translatedData.nextSteps.length > 0) {
            reportHTML += `
                <div>
                    <h6 class="text-info mb-3"><i class="fas fa-arrow-right me-2"></i>Sonraki Adımlar</h6>
                    <ol>
                        ${translatedData.nextSteps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            `;
        }

        return reportHTML || '<p class="text-muted">Detaylı analiz mevcut değil.</p>';
    }

    /**
     * Show offline mode notification
     */
    showOfflineModeNotification() {
        this.updateLoadingText(
            'Demo Modu Aktif', 
            'AI kullanım limiti dolmuş. Sabit demo test sunuluyor. Sonuçlar temel seviyede olacak.'
        );
        this.updateLoadingProgress(100);
    }

    /**
     * Show AI limited notification on results
     */
    showAILimitedNotification() {
        const levelDesc = document.getElementById('levelDescription');
        if (levelDesc && this.testResults.isAILimited) {
            levelDesc.innerHTML = `
                <h6>${this.testResults.levelInfo.title}</h6>
                <p>${this.testResults.levelInfo.description}</p>
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Demo Modu:</strong> AI kullanım hakkı dolmuştur. Detaylı rapor şu anda mevcut değildir.
                </div>
            `;
        } else if (levelDesc && this.testResults.isOfflineMode) {
            levelDesc.innerHTML = `
                <h6>${this.testResults.levelInfo?.title || 'Seviye Değerlendirmesi'}</h6>
                <p>${this.testResults.levelInfo?.description || 'Temel seviye değerlendirmesi tamamlandı.'}</p>
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Demo Test:</strong> Bu sabit bir demo testtir. AI destekli dinamik sorular şu anda mevcut değildir.
                </div>
            `;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Gemini API key is available
    try {
        window.app = new EnglishTestApp();
        console.log('English Proficiency Test App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        
        // Show error screen with API key setup instructions
        const errorScreen = document.getElementById('errorScreen');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.innerHTML = `
            <strong>Setup Required:</strong><br>
            This application requires a Gemini API key to function.<br><br>
            <strong>To get started:</strong><br>
            1. Get a free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a><br>
            2. Add it as a Replit Secret named 'GEMINI_API_KEY'<br>
            3. Or add ?apiKey=YOUR_KEY to the URL<br><br>
            <small>Your API key will be stored locally for convenience.</small>
        `;
        
        errorScreen.classList.add('active');
        
        // Add retry functionality
        document.getElementById('retryBtn').addEventListener('click', () => {
            location.reload();
        });
    }
});

// Export for debugging
window.EnglishTestApp = EnglishTestApp;
