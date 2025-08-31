/**
 * Static/Offline Test Questions
 * Fallback when AI API is unavailable or quota exceeded
 */

class StaticTest {
    constructor() {
        this.questions = [
            // A1 Level Grammar Questions
            {
                question: "I ___ from Turkey.",
                options: ["am", "is", "are", "be"],
                correct: 0,
                topic: "Present Simple - Be",
                level: "A1",
                type: "grammar",
                explanation: "Use 'am' with the pronoun 'I'."
            },
            {
                question: "She ___ to school every day.",
                options: ["go", "goes", "going", "gone"],
                correct: 1,
                topic: "Present Simple",
                level: "A1",
                type: "grammar",
                explanation: "Add 's' to verbs with he/she/it in present simple."
            },
            {
                question: "There ___ three books on the table.",
                options: ["is", "are", "am", "be"],
                correct: 1,
                topic: "There is/are",
                level: "A1",
                type: "grammar",
                explanation: "Use 'are' with plural nouns after 'there'."
            },
            {
                question: "I don't ___ coffee.",
                options: ["likes", "like", "liking", "liked"],
                correct: 1,
                topic: "Present Simple Negative",
                level: "A1",
                type: "grammar",
                explanation: "Use base form of verb after 'don't'."
            },
            {
                question: "___ you speak English?",
                options: ["Does", "Do", "Are", "Is"],
                correct: 1,
                topic: "Present Simple Questions",
                level: "A1",
                type: "grammar",
                explanation: "Use 'Do' for questions with 'you' in present simple."
            },

            // A2 Level Grammar Questions
            {
                question: "I ___ to the cinema yesterday.",
                options: ["go", "went", "going", "gone"],
                correct: 1,
                topic: "Past Simple",
                level: "A2",
                type: "grammar",
                explanation: "Use past simple for completed actions in the past."
            },
            {
                question: "He is ___ than his brother.",
                options: ["tall", "taller", "tallest", "more tall"],
                correct: 1,
                topic: "Comparatives",
                level: "A2",
                type: "grammar",
                explanation: "Add -er to short adjectives for comparisons."
            },
            {
                question: "I ___ finish my homework tonight.",
                options: ["will", "going", "am", "do"],
                correct: 0,
                topic: "Future Simple",
                level: "A2",
                type: "grammar",
                explanation: "Use 'will' to express future intentions."
            },
            {
                question: "You ___ eat too much sugar.",
                options: ["should", "shouldn't", "must", "can"],
                correct: 1,
                topic: "Modal Verbs",
                level: "A2",
                type: "grammar",
                explanation: "Use 'shouldn't' for negative advice."
            },
            {
                question: "There are ___ apples in the basket.",
                options: ["much", "many", "a lot", "any"],
                correct: 1,
                topic: "Much/Many",
                level: "A2",
                type: "grammar",
                explanation: "Use 'many' with countable plural nouns."
            },

            // B1 Level Grammar Questions
            {
                question: "I ___ lived here for five years.",
                options: ["am", "have", "has", "had"],
                correct: 1,
                topic: "Present Perfect",
                level: "B1",
                type: "grammar",
                explanation: "Use present perfect for experiences or actions continuing to present."
            },
            {
                question: "If it rains, I ___ at home.",
                options: ["stay", "will stay", "stayed", "staying"],
                correct: 1,
                topic: "First Conditional",
                level: "B1",
                type: "grammar",
                explanation: "Use 'will + base verb' in the main clause of first conditional."
            },
            {
                question: "The book ___ by millions of people.",
                options: ["read", "reads", "is read", "reading"],
                correct: 2,
                topic: "Passive Voice",
                level: "B1",
                type: "grammar",
                explanation: "Use passive voice when the action is more important than who does it."
            },
            {
                question: "I was watching TV ___ the phone rang.",
                options: ["while", "when", "during", "for"],
                correct: 1,
                topic: "Time Clauses",
                level: "B1",
                type: "grammar",
                explanation: "Use 'when' for a specific moment that interrupts an ongoing action."
            },
            {
                question: "He asked me ___ I was from Turkey.",
                options: ["that", "if", "what", "how"],
                correct: 1,
                topic: "Reported Speech",
                level: "B1",
                type: "grammar",
                explanation: "Use 'if' to report yes/no questions."
            },

            // B2 Level Grammar Questions
            {
                question: "I wish I ___ more languages.",
                options: ["speak", "spoke", "spoken", "speaking"],
                correct: 1,
                topic: "Wish + Past Simple",
                level: "B2",
                type: "grammar",
                explanation: "Use past simple after 'wish' for present regrets."
            },
            {
                question: "___ you help me, I would appreciate it.",
                options: ["Should", "Would", "Could", "Might"],
                correct: 0,
                topic: "Polite Requests",
                level: "B2",
                type: "grammar",
                explanation: "Use 'should' for polite conditional requests."
            },
            {
                question: "By next year, I ___ my degree.",
                options: ["complete", "will complete", "will have completed", "completing"],
                correct: 2,
                topic: "Future Perfect",
                level: "B2",
                type: "grammar",
                explanation: "Use future perfect for actions completed by a future time."
            },
            {
                question: "The meeting ___ for two hours when you arrive.",
                options: ["goes on", "will go on", "will have been going on", "is going on"],
                correct: 2,
                topic: "Future Perfect Continuous",
                level: "B2",
                type: "grammar",
                explanation: "Use future perfect continuous for ongoing actions up to a future point."
            },
            {
                question: "I'd rather you ___ smoking in here.",
                options: ["stop", "stopped", "stopping", "to stop"],
                correct: 1,
                topic: "Would Rather",
                level: "B2",
                type: "grammar",
                explanation: "Use past simple after 'would rather' when referring to other people."
            },

            // C1 Level Grammar Questions
            {
                question: "___ had I arrived when it started raining.",
                options: ["Hardly", "Hard", "Hardest", "Harder"],
                correct: 0,
                topic: "Inversion",
                level: "C1",
                type: "grammar",
                explanation: "Use inversion with 'hardly' for emphasis."
            },
            {
                question: "Were it not for your help, I ___ failed.",
                options: ["would", "would have", "will", "will have"],
                correct: 1,
                topic: "Subjunctive",
                level: "C1",
                type: "grammar",
                explanation: "Use 'would have' in subjunctive conditionals about the past."
            },
            {
                question: "The proposal ___ by the committee next week.",
                options: ["reviews", "is reviewing", "will be reviewed", "reviewed"],
                correct: 2,
                topic: "Future Passive",
                level: "C1",
                type: "grammar",
                explanation: "Use future passive when the focus is on the action, not the doer."
            },
            {
                question: "I can't help ___ that he's not telling the truth.",
                options: ["think", "thinking", "to think", "thought"],
                correct: 1,
                topic: "Gerunds and Infinitives",
                level: "C1",
                type: "grammar",
                explanation: "Use gerund after 'can't help'."
            },
            {
                question: "Little ___ he know what awaited him.",
                options: ["did", "does", "had", "has"],
                correct: 0,
                topic: "Negative Inversion",
                level: "C1",
                type: "grammar",
                explanation: "Use 'did' in negative inversion with 'little'."
            },

            // Reading Comprehension Questions
            {
                passage: "Istanbul is Turkey's largest city and former capital. With over 15 million inhabitants, it's one of the world's most populous cities. The city is located on both European and Asian continents, separated by the Bosphorus strait. Istanbul has a rich history spanning over 2,500 years and was once the capital of both Byzantine and Ottoman empires.",
                question: "What is the main topic of this passage?",
                options: ["Turkish history", "Istanbul's geography and history", "European cities", "The Ottoman Empire"],
                correct: 1,
                topic: "Main Idea",
                level: "B1",
                type: "reading",
                explanation: "The passage provides an overview of Istanbul covering both its geographical features and historical significance."
            },
            {
                passage: "Istanbul is Turkey's largest city and former capital. With over 15 million inhabitants, it's one of the world's most populous cities. The city is located on both European and Asian continents, separated by the Bosphorus strait. Istanbul has a rich history spanning over 2,500 years and was once the capital of both Byzantine and Ottoman empires.",
                question: "According to the passage, Istanbul is separated by:",
                options: ["The Mediterranean Sea", "The Bosphorus strait", "The Black Sea", "The Marmara Sea"],
                correct: 1,
                topic: "Detail Comprehension",
                level: "B1",
                type: "reading",
                explanation: "The passage explicitly states that the Bosphorus strait separates the European and Asian parts of Istanbul."
            },
            {
                passage: "Remote work has become increasingly popular in recent years, especially after the global pandemic. Many companies have discovered that employees can be just as productive working from home as they are in traditional office settings. However, remote work also presents challenges such as maintaining team cohesion, ensuring effective communication, and managing work-life balance. Success in remote work requires discipline, proper time management, and reliable technology infrastructure.",
                question: "What can be inferred about remote work from this passage?",
                options: ["It's always better than office work", "It requires no special skills", "It has both advantages and disadvantages", "It's only temporary"],
                correct: 2,
                topic: "Inference",
                level: "B2",
                type: "reading",
                explanation: "The passage presents both positive aspects (productivity) and challenges of remote work."
            },
            {
                passage: "Remote work has become increasingly popular in recent years, especially after the global pandemic. Many companies have discovered that employees can be just as productive working from home as they are in traditional office settings. However, remote work also presents challenges such as maintaining team cohesion, ensuring effective communication, and managing work-life balance. Success in remote work requires discipline, proper time management, and reliable technology infrastructure.",
                question: "According to the passage, successful remote work requires all of the following EXCEPT:",
                options: ["Discipline", "Time management", "Expensive equipment", "Technology infrastructure"],
                correct: 2,
                topic: "Detail Comprehension",
                level: "B2",
                type: "reading",
                explanation: "The passage mentions 'reliable technology infrastructure' but doesn't specify it needs to be expensive."
            },
            {
                passage: "The concept of artificial intelligence has evolved dramatically over the past few decades. What was once confined to the realm of science fiction has now become an integral part of our daily lives. From recommendation algorithms on streaming platforms to voice assistants in our smartphones, AI technologies are ubiquitous. However, this rapid advancement has also sparked debates about ethics, privacy, and the future of human employment. As we stand on the brink of even more sophisticated AI developments, society must grapple with both the tremendous opportunities and potential risks that lie ahead.",
                question: "The author's tone in this passage can best be described as:",
                options: ["Pessimistic and fearful", "Neutral and informative", "Enthusiastic and promotional", "Critical and dismissive"],
                correct: 1,
                topic: "Tone and Attitude",
                level: "C1",
                type: "reading",
                explanation: "The author presents both positive aspects and concerns about AI without taking a strong stance either way."
            }
        ];
    }

    /**
     * Get static test questions (30 total)
     */
    getQuestions() {
        return this.questions;
    }

    /**
     * Get basic level assessment based on score
     */
    assessLevel(correctAnswers, totalQuestions) {
        const accuracy = correctAnswers / totalQuestions;
        
        if (accuracy >= 0.9) return 'C1';
        else if (accuracy >= 0.8) return 'B2';
        else if (accuracy >= 0.7) return 'B1';
        else if (accuracy >= 0.6) return 'A2';
        else return 'A1';
    }

    /**
     * Generate basic offline report
     */
    generateOfflineReport(answers, questions) {
        const correctAnswers = answers.filter((answer, index) => answer === questions[index].correct).length;
        const level = this.assessLevel(correctAnswers, questions.length);
        const accuracy = Math.round((correctAnswers / questions.length) * 100);

        // Basic topic analysis
        const topicStats = {};
        questions.forEach((question, index) => {
            const topic = question.topic;
            if (!topicStats[topic]) {
                topicStats[topic] = { correct: 0, total: 0 };
            }
            topicStats[topic].total++;
            if (answers[index] === question.correct) {
                topicStats[topic].correct++;
            }
        });

        const weakAreas = [];
        Object.entries(topicStats).forEach(([topic, stats]) => {
            const topicAccuracy = stats.correct / stats.total;
            if (topicAccuracy < 0.7) {
                weakAreas.push({
                    topic: topic,
                    explanation: `You got ${stats.correct}/${stats.total} questions correct in this area.`,
                    performance: topicAccuracy < 0.5 ? 'needs-improvement' : 'fair',
                    recommendations: [`Practice more ${topic} exercises`, `Review ${topic} grammar rules`]
                });
            }
        });

        return {
            totalScore: correctAnswers,
            totalQuestions: questions.length,
            accuracy: accuracy,
            level: level,
            grammarResults: {
                correct: answers.filter((answer, index) => 
                    answer === questions[index].correct && questions[index].type === 'grammar').length,
                total: questions.filter(q => q.type === 'grammar').length
            },
            readingResults: {
                correct: answers.filter((answer, index) => 
                    answer === questions[index].correct && questions[index].type === 'reading').length,
                total: questions.filter(q => q.type === 'reading').length
            },
            isOfflineMode: true,
            learningReport: {
                level: level,
                levelDescription: 'Bu demo sürümünde detaylı analiz mevcut değildir. Tam rapor için AI hizmetlerinin aktif olması gerekir.',
                strengths: correctAnswers > questions.length * 0.7 ? ['Genel İngilizce bilgisi'] : [],
                weakAreas: weakAreas,
                overallRecommendations: [
                    'Düzenli İngilizce pratiği yapın',
                    'Zayıf olduğunuz konulara odaklanın',
                    'İngilizce okuma alışkanlığı edinin'
                ],
                nextSteps: [
                    'Bu demo testini referans olarak kullanın',
                    'Zayıf alanlarınızı belirleyin ve çalışın',
                    'İlerlemek için günlük İngilizce pratiği yapın'
                ]
            }
        };
    }
}

// Export for use in other modules
window.StaticTest = StaticTest;