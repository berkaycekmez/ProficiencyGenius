/**
 * Test Engine for English Proficiency Test
 * Manages test flow, question generation, and user interactions
 */

class TestEngine {
    constructor(geminiService, evaluator) {
        this.geminiService = geminiService;
        this.evaluator = evaluator;
        this.staticTest = new StaticTest();
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
     * Generate all test questions
     */
    async generateTest() {
        try {
            this.testStartTime = new Date();
            this.isTestActive = true;
            this.isOfflineMode = false;
            
            // Try AI-generated test first
            try {
                // Generate grammar questions with progressive difficulty
                const grammarQuestions = await this.generateProgressiveGrammarQuestions();
                
                // Generate reading comprehension questions
                const readingQuestions = await this.generateReadingQuestions();
                
                // Combine and shuffle questions
                this.questions = [...grammarQuestions, ...readingQuestions];
                this.answers = new Array(this.questions.length).fill(null);
                
                return this.questions;
            } catch (error) {
                // Check if it's a quota error
                if (error.isQuotaError || error.message.includes('QUOTA_EXCEEDED')) {
                    console.warn('AI quota exceeded, falling back to static test');
                    return this.generateStaticTest();
                }
                throw error;
            }
        } catch (error) {
            console.error('Test generation failed:', error);
            
            // Final fallback to static test
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
     * Generate grammar questions with progressive difficulty
     */
    async generateProgressiveGrammarQuestions() {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
        const questionsPerLevel = 5; // 25 total grammar questions
        const allGrammarQuestions = [];

        for (const level of levels) {
            try {
                const questions = await this.geminiService.generateGrammarQuestions(level, questionsPerLevel);
                
                // Add metadata to questions
                const processedQuestions = questions.map(q => ({
                    ...q,
                    type: 'grammar',
                    level: level,
                    id: `grammar_${level}_${Math.random().toString(36).substr(2, 9)}`
                }));
                
                allGrammarQuestions.push(...processedQuestions);
            } catch (error) {
                console.error(`Failed to generate ${level} grammar questions:`, error);
                // Continue with other levels
            }
        }

        if (allGrammarQuestions.length === 0) {
            throw new Error('Failed to generate any grammar questions');
        }

        return allGrammarQuestions;
    }

    /**
     * Generate reading comprehension questions
     */
    async generateReadingQuestions() {
        const levels = ['B1', 'B2']; // Focus on intermediate levels for reading
        const allReadingQuestions = [];

        for (const level of levels) {
            try {
                const readingExercises = await this.geminiService.generateReadingQuestions(level, 1);
                
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
                // Continue with other levels
            }
        }

        // If we don't have enough reading questions, fill with B1 level
        while (allReadingQuestions.length < 5) {
            try {
                const fallbackExercises = await this.geminiService.generateReadingQuestions('B1', 1);
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

        return allReadingQuestions.slice(0, 5); // Ensure exactly 5 questions
    }

    /**
     * Get current question
     */
    getCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            return null;
        }
        return this.questions[this.currentQuestionIndex];
    }

    /**
     * Answer current question
     */
    answerQuestion(answerIndex) {
        if (this.currentQuestionIndex >= this.questions.length) {
            throw new Error('No current question to answer');
        }
        
        this.answers[this.currentQuestionIndex] = answerIndex;
    }

    /**
     * Move to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }

    /**
     * Move to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }

    /**
     * Check if test is complete
     */
    isComplete() {
        return this.answers.every(answer => answer !== null);
    }

    /**
     * Get test progress
     */
    getProgress() {
        const answered = this.answers.filter(answer => answer !== null).length;
        return {
            current: this.currentQuestionIndex + 1,
            total: this.questions.length,
            answered: answered,
            percentage: (this.currentQuestionIndex / this.questions.length) * 100
        };
    }

    /**
     * Get user answer for a specific question
     */
    getUserAnswer(questionIndex) {
        return this.answers[questionIndex];
    }

    /**
     * Check if current question is answered
     */
    isCurrentQuestionAnswered() {
        return this.answers[this.currentQuestionIndex] !== null;
    }

    /**
     * Finish test and get results
     */
    async finishTest() {
        if (!this.isComplete()) {
            throw new Error('Test is not complete. Please answer all questions.');
        }

        this.testEndTime = new Date();
        this.isTestActive = false;

        try {
            // If in offline mode, use static test results
            if (this.isOfflineMode) {
                return this.staticTest.generateOfflineReport(this.answers, this.questions);
            }

            // Calculate basic results
            const results = this.evaluator.calculateResults(this.answers, this.questions);
            
            // Try to generate AI learning report
            try {
                const learningReport = await this.geminiService.generateLearningReport(this.answers, this.questions);
                return {
                    ...results,
                    learningReport,
                    testDuration: this.testEndTime - this.testStartTime,
                    completedAt: this.testEndTime
                };
            } catch (reportError) {
                console.warn('Failed to generate AI learning report:', reportError);
                
                // Return results with basic report if AI fails
                return {
                    ...results,
                    learningReport: {
                        level: results.level,
                        levelDescription: 'Bu demo sürümünde AI kullanım hakkı dolmuştur. Detaylı analiz şu anda mevcut değildir.',
                        strengths: results.accuracy > 70 ? ['Genel İngilizce performansı'] : [],
                        weakAreas: [],
                        overallRecommendations: [
                            'Düzenli İngilizce pratiği yapın',
                            'AI limitlerinin yenilenmesi için biraz bekleyin'
                        ],
                        nextSteps: [
                            'Zayıf alanlarınızı tespit edin',
                            'Daha sonra detaylı analiz için tekrar deneyin'
                        ]
                    },
                    testDuration: this.testEndTime - this.testStartTime,
                    completedAt: this.testEndTime,
                    isAILimited: true
                };
            }
        } catch (error) {
            console.error('Failed to generate complete results:', error);
            
            // Final fallback to basic results
            const basicResults = this.evaluator.calculateResults(this.answers, this.questions);
            return {
                ...basicResults,
                learningReport: {
                    level: basicResults.level,
                    levelDescription: 'Teknik bir sorun nedeniyle detaylı analiz oluşturulamadı.',
                    strengths: [],
                    weakAreas: [],
                    overallRecommendations: ['İngilizce pratiğine devam edin'],
                    nextSteps: ['Lütfen daha sonra tekrar deneyin']
                },
                testDuration: this.testEndTime - this.testStartTime,
                completedAt: this.testEndTime
            };
        }
    }

    /**
     * Get test statistics
     */
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

    /**
     * Export test data for analysis
     */
    exportTestData() {
        return {
            questions: this.questions,
            answers: this.answers,
            startTime: this.testStartTime,
            endTime: this.testEndTime,
            currentIndex: this.currentQuestionIndex
        };
    }

    /**
     * Import test data (for resuming tests)
     */
    importTestData(data) {
        this.questions = data.questions || [];
        this.answers = data.answers || [];
        this.testStartTime = data.startTime;
        this.testEndTime = data.endTime;
        this.currentQuestionIndex = data.currentIndex || 0;
        this.isTestActive = !data.endTime;
    }
}

// Export for use in other modules
window.TestEngine = TestEngine;
