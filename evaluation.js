/**
 * Evaluation Module for English Proficiency Test
 * Handles scoring, level assessment, and performance analysis
 */

class Evaluator {
    constructor() {
        this.levelThresholds = {
            'A1': { min: 0, max: 0.45 },
            'A2': { min: 0.45, max: 0.60 },
            'B1': { min: 0.60, max: 0.75 },
            'B2': { min: 0.75, max: 0.85 },
            'C1': { min: 0.85, max: 1.0 }
        };

        this.levelDescriptions = {
            'A1': {
                title: 'Beginner (A1)',
                description: 'You can understand and use familiar everyday expressions and very basic phrases. You can introduce yourself and ask simple questions about personal details.',
                skills: ['Basic vocabulary', 'Simple present tense', 'Personal information', 'Numbers and time']
            },
            'A2': {
                title: 'Elementary (A2)', 
                description: 'You can understand sentences and frequently used expressions related to areas of immediate relevance (e.g., personal and family information, shopping, employment).',
                skills: ['Past and future tenses', 'Comparatives', 'Modal verbs', 'Everyday situations']
            },
            'B1': {
                title: 'Intermediate (B1)',
                description: 'You can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.',
                skills: ['Present perfect', 'Conditionals', 'Passive voice', 'Abstract topics']
            },
            'B2': {
                title: 'Upper-Intermediate (B2)',
                description: 'You can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions in your field.',
                skills: ['Complex tenses', 'Advanced vocabulary', 'Phrasal verbs', 'Formal/informal registers']
            },
            'C1': {
                title: 'Advanced (C1)',
                description: 'You can understand a wide range of demanding, longer texts, and recognize implicit meaning. You can express yourself fluently and spontaneously.',
                skills: ['Nuanced language', 'Complex structures', 'Idiomatic expressions', 'Professional communication']
            }
        };
    }

    /**
     * Calculate overall test results
     */
    calculateResults(answers, questions) {
        const totalQuestions = questions.length;
        const correctAnswers = this.countCorrectAnswers(answers, questions);
        const accuracy = correctAnswers / totalQuestions;

        // Calculate scores by type
        const grammarResults = this.calculateGrammarResults(answers, questions);
        const readingResults = this.calculateReadingResults(answers, questions);

        // Determine proficiency level
        const level = this.determineProficiencyLevel(accuracy, answers, questions);

        return {
            totalScore: correctAnswers,
            totalQuestions: totalQuestions,
            accuracy: Math.round(accuracy * 100),
            level: level,
            levelInfo: this.levelDescriptions[level],
            grammarResults: grammarResults,
            readingResults: readingResults,
            detailedAnalysis: this.generateDetailedAnalysis(answers, questions)
        };
    }

    /**
     * Count correct answers
     */
    countCorrectAnswers(answers, questions) {
        let correct = 0;
        answers.forEach((answer, index) => {
            if (answer === questions[index].correct) {
                correct++;
            }
        });
        return correct;
    }

    /**
     * Calculate grammar-specific results
     */
    calculateGrammarResults(answers, questions) {
        const grammarQuestions = questions.filter((q, index) => q.type === 'grammar');
        const grammarAnswers = answers.filter((answer, index) => questions[index].type === 'grammar');
        
        const correct = grammarAnswers.filter((answer, index) => 
            answer === grammarQuestions[index].correct
        ).length;

        return {
            correct: correct,
            total: grammarQuestions.length,
            accuracy: grammarQuestions.length > 0 ? Math.round((correct / grammarQuestions.length) * 100) : 0
        };
    }

    /**
     * Calculate reading comprehension results
     */
    calculateReadingResults(answers, questions) {
        const readingQuestions = questions.filter((q, index) => q.type === 'reading');
        const readingAnswers = answers.filter((answer, index) => questions[index].type === 'reading');
        
        const correct = readingAnswers.filter((answer, index) => 
            answer === readingQuestions[index].correct
        ).length;

        return {
            correct: correct,
            total: readingQuestions.length,
            accuracy: readingQuestions.length > 0 ? Math.round((correct / readingQuestions.length) * 100) : 0
        };
    }

    /**
     * Determine proficiency level based on performance
     */
    determineProficiencyLevel(overallAccuracy, answers, questions) {
        // Weight different factors
        const levelPerformance = this.analyzeLevelPerformance(answers, questions);
        const grammarAccuracy = this.calculateGrammarResults(answers, questions).accuracy / 100;
        const readingAccuracy = this.calculateReadingResults(answers, questions).accuracy / 100;

        // Composite score considering different factors
        const compositeScore = (overallAccuracy * 0.4) + (grammarAccuracy * 0.35) + (readingAccuracy * 0.25);

        // Determine level based on thresholds
        for (const [level, threshold] of Object.entries(this.levelThresholds)) {
            if (compositeScore >= threshold.min && compositeScore < threshold.max) {
                // Fine-tune based on level-specific performance
                if (levelPerformance[level] && levelPerformance[level].accuracy < 0.5) {
                    // If performance at this level is poor, consider lower level
                    const lowerLevel = this.getLowerLevel(level);
                    if (lowerLevel) return lowerLevel;
                }
                return level;
            }
        }

        return 'C1'; // Default to highest level if score is very high
    }

    /**
     * Analyze performance by proficiency level
     */
    analyzeLevelPerformance(answers, questions) {
        const levelPerformance = {};

        questions.forEach((question, index) => {
            const level = question.level;
            const isCorrect = answers[index] === question.correct;

            if (!levelPerformance[level]) {
                levelPerformance[level] = { correct: 0, total: 0, accuracy: 0 };
            }

            levelPerformance[level].total++;
            if (isCorrect) {
                levelPerformance[level].correct++;
            }
        });

        // Calculate accuracy for each level
        Object.keys(levelPerformance).forEach(level => {
            const perf = levelPerformance[level];
            perf.accuracy = perf.total > 0 ? perf.correct / perf.total : 0;
        });

        return levelPerformance;
    }

    /**
     * Get lower proficiency level
     */
    getLowerLevel(currentLevel) {
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex > 0 ? levels[currentIndex - 1] : null;
    }

    /**
     * Generate detailed performance analysis
     */
    generateDetailedAnalysis(answers, questions) {
        const topicAnalysis = {};
        const levelAnalysis = {};
        const typeAnalysis = { grammar: { correct: 0, total: 0 }, reading: { correct: 0, total: 0 } };

        questions.forEach((question, index) => {
            const answer = answers[index];
            const isCorrect = answer === question.correct;
            const topic = question.topic || 'General';
            const level = question.level;
            const type = question.type;

            // Topic analysis
            if (!topicAnalysis[topic]) {
                topicAnalysis[topic] = { correct: 0, total: 0, questions: [] };
            }
            topicAnalysis[topic].total++;
            topicAnalysis[topic].questions.push({
                question: question.question,
                correct: isCorrect,
                userAnswer: answer,
                correctAnswer: question.correct,
                explanation: question.explanation
            });
            if (isCorrect) {
                topicAnalysis[topic].correct++;
            }

            // Level analysis
            if (!levelAnalysis[level]) {
                levelAnalysis[level] = { correct: 0, total: 0 };
            }
            levelAnalysis[level].total++;
            if (isCorrect) {
                levelAnalysis[level].correct++;
            }

            // Type analysis
            if (typeAnalysis[type]) {
                typeAnalysis[type].total++;
                if (isCorrect) {
                    typeAnalysis[type].correct++;
                }
            }
        });

        // Calculate percentages
        Object.keys(topicAnalysis).forEach(topic => {
            const analysis = topicAnalysis[topic];
            analysis.accuracy = analysis.total > 0 ? (analysis.correct / analysis.total) * 100 : 0;
            analysis.performance = this.getPerformanceLevel(analysis.accuracy);
        });

        Object.keys(levelAnalysis).forEach(level => {
            const analysis = levelAnalysis[level];
            analysis.accuracy = analysis.total > 0 ? (analysis.correct / analysis.total) * 100 : 0;
        });

        Object.keys(typeAnalysis).forEach(type => {
            const analysis = typeAnalysis[type];
            analysis.accuracy = analysis.total > 0 ? (analysis.correct / analysis.total) * 100 : 0;
        });

        return {
            byTopic: topicAnalysis,
            byLevel: levelAnalysis,
            byType: typeAnalysis
        };
    }

    /**
     * Get performance level description
     */
    getPerformanceLevel(accuracy) {
        if (accuracy >= 80) return 'excellent';
        if (accuracy >= 65) return 'good';
        if (accuracy >= 50) return 'fair';
        return 'needs-improvement';
    }

    /**
     * Generate study recommendations based on weak areas
     */
    generateStudyRecommendations(detailedAnalysis) {
        const recommendations = [];
        const weakTopics = [];

        Object.entries(detailedAnalysis.byTopic).forEach(([topic, analysis]) => {
            if (analysis.accuracy < 70) {
                weakTopics.push({
                    topic: topic,
                    accuracy: analysis.accuracy,
                    questions: analysis.questions.filter(q => !q.correct)
                });
            }
        });

        // Sort by poorest performance
        weakTopics.sort((a, b) => a.accuracy - b.accuracy);

        weakTopics.forEach(topicData => {
            recommendations.push({
                topic: topicData.topic,
                priority: topicData.accuracy < 50 ? 'high' : 'medium',
                suggestions: this.getTopicRecommendations(topicData.topic),
                examples: topicData.questions.slice(0, 2) // Show first 2 mistakes
            });
        });

        return recommendations;
    }

    /**
     * Get specific recommendations for a topic
     */
    getTopicRecommendations(topic) {
        const recommendations = {
            'Present Simple': [
                'Practice verb conjugation with third person singular',
                'Review question and negative forms',
                'Focus on frequency adverbs placement'
            ],
            'Past Tense': [
                'Study irregular verb forms',
                'Practice past simple vs past continuous',
                'Review time expressions for past events'
            ],
            'Present Perfect': [
                'Understand the difference between past simple and present perfect',
                'Practice with "already", "yet", "just", "ever", "never"',
                'Focus on life experiences and recent events'
            ],
            'Conditionals': [
                'Study the structure of zero, first, and second conditionals',
                'Practice hypothetical situations',
                'Review if/unless clause patterns'
            ],
            'Passive Voice': [
                'Practice converting active to passive sentences',
                'Focus on when to use passive constructions',
                'Study passive forms in different tenses'
            ],
            'Vocabulary': [
                'Build word families and collocations',
                'Practice synonyms and antonyms',
                'Focus on context clues in reading'
            ],
            'Reading Comprehension': [
                'Practice skimming and scanning techniques',
                'Focus on identifying main ideas vs details',
                'Work on inferencing and implied meanings'
            ]
        };

        return recommendations[topic] || [
            'Review the fundamentals of this topic',
            'Practice with additional exercises',
            'Seek help from a teacher or tutor'
        ];
    }

    /**
     * Calculate improvement areas
     */
    calculateImprovementAreas(detailedAnalysis) {
        const areas = [];

        // Grammar areas needing improvement
        Object.entries(detailedAnalysis.byTopic).forEach(([topic, analysis]) => {
            if (analysis.accuracy < 75) {
                areas.push({
                    area: topic,
                    type: 'grammar',
                    currentLevel: this.getPerformanceLevel(analysis.accuracy),
                    improvementNeeded: 75 - analysis.accuracy,
                    priority: analysis.accuracy < 50 ? 'high' : 'medium'
                });
            }
        });

        // Reading comprehension if poor
        if (detailedAnalysis.byType.reading.accuracy < 70) {
            areas.push({
                area: 'Reading Comprehension',
                type: 'reading',
                currentLevel: this.getPerformanceLevel(detailedAnalysis.byType.reading.accuracy),
                improvementNeeded: 70 - detailedAnalysis.byType.reading.accuracy,
                priority: 'high'
            });
        }

        return areas.sort((a, b) => {
            // Sort by priority (high first) then by improvement needed
            if (a.priority !== b.priority) {
                return a.priority === 'high' ? -1 : 1;
            }
            return b.improvementNeeded - a.improvementNeeded;
        });
    }
}

// Export for use in other modules
window.Evaluator = Evaluator;
