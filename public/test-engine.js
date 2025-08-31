/**
 * Test Engine for English Proficiency Test (YENİ VERSİYON - SUNUCU İLE KONUŞUR)
 * Manages test flow, question generation, and user interactions
 */

class TestEngine {
    constructor(evaluator) {
        // DİKKAT: geminiService parametresini kaldırdık. Artık ona ihtiyacımız yok.
        this.evaluator = evaluator;
        this.staticTest = new StaticTest(); // Bu dosyanın projenizde olduğundan emin olun
        this.isOfflineMode = false;
        this.reset();
    }

    /**
     * Reset test state
     */
    reset() {
        this.questions = [];
        this.answers = [];
        this.currentQuestionIndex = 0;
        this.testStartTime = null;
        this.testEndTime = null;
        this.currentLevel = 'A1';
        this.isTestActive = false;
    }

    /**
     * Generate all test questions by calling our backend API
     */
    async generateTest() {
        try {
            this.testStartTime = new Date();
            this.isTestActive = true;
            this.isOfflineMode = false;

            // Try AI-generated test first by calling our backend
            try {
                const grammarQuestions = await this.generateProgressiveGrammarQuestions();
                const readingQuestions = await this.generateReadingQuestions();
                
                this.questions = [...grammarQuestions, ...readingQuestions];
                this.answers = new Array(this.questions.length).fill(null);
                
                return this.questions;
            } catch (error) {
                if (error.isQuotaError || (error.message && error.message.includes('QUOTA_EXCEEDED'))) {
                    console.warn('AI quota exceeded, falling back to static test');
                    return this.generateStaticTest();
                }
                throw error;
            }
        } catch (error) {
            console.error('Test generation failed:', error);
            console.warn('Falling back to static test due to error:', error.message);
            return this.generateStaticTest();
        }
    }

    /**
     * Generate static/offline test
     */
    generateStaticTest() {
        console.log('Using offline static test');
        this.isOfflineMode = true;
        this.questions = this.staticTest.getQuestions();
        this.answers = new Array(this.questions.length).fill(null);
        return this.questions;
    }

    /**
     * Generate grammar questions by calling our backend API
     */
    async generateProgressiveGrammarQuestions() {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
        const questionsPerLevel = 5;
        const allGrammarQuestions = [];

        for (const level of levels) {
            try {
                // ESKİ: const questions = await this.geminiService.generateGrammarQuestions(level, questionsPerLevel);
                // YENİ:
                const questions = await callApi('generateGrammarQuestions', level, questionsPerLevel);

                const processedQuestions = questions.map(q => ({
                    ...q,
                    type: 'grammar',
                    level: level,
                    id: `grammar_${level}_${Math.random().toString(36).substr(2, 9)}`
                }));
                allGrammarQuestions.push(...processedQuestions);
            } catch (error) {
                console.error(`Failed to generate ${level} grammar questions:`, error);
            }
        }

        if (allGrammarQuestions.length === 0) {
            throw new Error('Failed to generate any grammar questions');
        }
        return allGrammarQuestions;
    }

    /**
     * Generate reading comprehension questions by calling our backend API
     */
    async generateReadingQuestions() {
        const levels = ['B1', 'B2'];
        const allReadingQuestions = [];

        for (const level of levels) {
            try {
                // ESKİ: const readingExercises = await this.geminiService.generateReadingQuestions(level, 1);
                // YENİ:
                const readingExercises = await callApi('generateReadingQuestions', level, 1);

                readingExercises.forEach(exercise => {
                    exercise.questions.forEach((question, index) => {
                        allReadingQuestions.push({
                            ...question,
                            type: 'reading',
                            passage: exercise.passage,
                            level: level,
                            id: `reading_${level}_${index}_${Math.random().toString(36).substr(2, 9)}`
                        });
                    });
                });
            } catch (error) {
                console.error(`Failed to generate ${level} reading questions:`, error);
            }
        }

        while (allReadingQuestions.length < 5) {
            try {
                // ESKİ: const fallbackExercises = await this.geminiService.generateReadingQuestions('B1', 1);
                // YENİ:
                const fallbackExercises = await callApi('generateReadingQuestions', 'B1', 1);

                fallbackExercises[0].questions.forEach((question, index) => {
                    if (allReadingQuestions.length < 5) {
                        allReadingQuestions.push({
                            ...question,
                            type: 'reading',
                            passage: fallbackExercises[0].passage,
                            level: 'B1',
                            id: `reading_fallback_${index}_${Math.random().toString(36).substr(2, 9)}`
                        });
                    }
                });
                break;
            } catch (error) {
                console.error('Failed to generate fallback reading questions:', error);
                break;
            }
        }
        return allReadingQuestions.slice(0, 5);
    }

    /**
     * Finish test and get results, calling backend API for the report
     */
    async finishTest() {
        if (!this.isComplete()) {
            throw new Error('Test is not complete. Please answer all questions.');
        }

        this.testEndTime = new Date();
        this.isTestActive = false;

        try {
            if (this.isOfflineMode) {
                return this.staticTest.generateOfflineReport(this.answers, this.questions);
            }

            const results = this.evaluator.calculateResults(this.answers, this.questions);
            
            try {
                // ESKİ: const learningReport = await this.geminiService.generateLearningReport(this.answers, this.questions);
                // YENİ:
                const learningReport = await callApi('generateLearningReport', this.answers, this.questions);
                
                return {
                    ...results,
                    learningReport,
                    testDuration: this.testEndTime - this.testStartTime,
                    completedAt: this.testEndTime
                };
            } catch (reportError) {
                console.warn('Failed to generate AI learning report:', reportError);
                return {
                    ...results,
                    learningReport: { /* ... basic report ... */ },
                    isAILimited: true
                };
            }
        } catch (error) {
            console.error('Failed to generate complete results:', error);
            const basicResults = this.evaluator.calculateResults(this.answers, this.questions);
            return {
                ...basicResults,
                learningReport: { /* ... final fallback report ... */ }
            };
        }
    }

    // --- GERİ KALAN TÜM FONKSİYONLARIN AYNI KALIYOR ---
    // getCurrentQuestion, answerQuestion, nextQuestion, previousQuestion, isComplete, getProgress vb.
    // Bu fonksiyonlar Gemini'a istek atmadığı için hiçbir değişiklik gerektirmez.

    getCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) return null;
        return this.questions[this.currentQuestionIndex];
    }
    answerQuestion(answerIndex) {
        if (this.currentQuestionIndex >= this.questions.length) throw new Error('No current question to answer');
        this.answers[this.currentQuestionIndex] = answerIndex;
    }
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }
    isComplete() {
        return this.answers.every(answer => answer !== null);
    }
    getProgress() {
        const answered = this.answers.filter(answer => answer !== null).length;
        return {
            current: this.currentQuestionIndex + 1,
            total: this.questions.length,
            answered: answered,
            percentage: (this.currentQuestionIndex / this.questions.length) * 100
        };
    }
    getUserAnswer(questionIndex) {
        return this.answers[questionIndex];
    }
    isCurrentQuestionAnswered() {
        return this.answers[this.currentQuestionIndex] !== null;
    }
    getTestStatistics() {
        if (!this.questions.length) return null;
        const grammarQuestions = this.questions.filter(q => q.type === 'grammar');
        const readingQuestions = this.questions.filter(q => q.type === 'reading');
        const levelDistribution = {};
        this.questions.forEach(q => {
            levelDistribution[q.level] = (levelDistribution[q.level] || 0) + 1;
        });
        return {
            totalQuestions: this.questions.length,
            grammarQuestions: grammarQuestions.length,
            readingQuestions: readingQuestions.length,
            levelDistribution,
            currentProgress: this.getProgress()
        };
    }
    exportTestData() {
        return {
            questions: this.questions,
            answers: this.answers,
            startTime: this.testStartTime,
            endTime: this.testEndTime,
            currentIndex: this.currentQuestionIndex
        };
    }
    importTestData(data) {
        this.questions = data.questions || [];
        this.answers = data.answers || [];
        this.testStartTime = data.startTime;
        this.testEndTime = data.endTime;
        this.currentQuestionIndex = data.currentIndex || 0;
        this.isTestActive = !data.endTime;
    }
}