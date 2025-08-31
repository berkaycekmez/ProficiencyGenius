# English Proficiency Test Application

🎓 **AI-Powered English Level Assessment with Turkish Support**

An adaptive English proficiency testing application that uses Google's Gemini AI to generate personalized questions and provide detailed learning reports. Features progressive difficulty scaling from A1 to C1 levels with offline fallback capabilities.

## ✨ Features

### 🤖 AI-Powered Assessment
- **Dynamic Question Generation**: Real-time question creation using Google Gemini AI
- **Progressive Difficulty**: Adaptive scaling from A1 (beginner) to C1 (advanced) levels
- **Mixed Question Types**: Grammar questions + Reading comprehension exercises
- **Personalized Reports**: Detailed analysis with strengths, weaknesses, and recommendations

### 🌍 Turkish Language Support
- **Bilingual Interface**: Learning reports and feedback in Turkish
- **Cultural Adaptation**: Designed specifically for Turkish-speaking learners
- **Cancel Exam Feature**: Turkish confirmation dialogs for test interruption

### 🚀 Robust Architecture
- **Offline Fallback**: 30 pre-built questions when AI quota is exceeded
- **Error Handling**: Graceful degradation with informative user messages
- **Responsive Design**: Mobile-first Bootstrap interface
- **Real-time Feedback**: Immediate question navigation and progress tracking

### 📊 Comprehensive Evaluation
- **CEFR Level Assessment**: Accurate placement according to European standards
- **Performance Analytics**: Grammar vs Reading comprehension breakdown
- **Skill Recommendations**: Targeted improvement suggestions
- **Progress Tracking**: Detailed scoring with explanations

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **UI Framework**: Bootstrap 5.3.0
- **Icons**: Font Awesome 6.4.0
- **AI Service**: Google Gemini API
- **Architecture**: Modular ES6 classes
- **Deployment**: Python HTTP server

## 🚀 Quick Start

### Prerequisites
- Python 3.x
- Google Gemini API Key
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/english-proficiency-test.git
   cd english-proficiency-test
   ```

2. **Set up your Gemini API Key**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/)
   - Replace the placeholder in `index.html`:
   ```javascript
   window.GEMINI_API_KEY = 'your-actual-api-key-here';
   ```

3. **Start the server**
   ```bash
   python start.py
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5000`
   - Click "Start Test" to begin

### 🔧 Configuration Options

#### For Replit Deployment
Set your API key as an environment variable:
```bash
export GEMINI_API_KEY=your-api-key
```

#### API Key in URL (for demos)
```
http://localhost:5000/?apiKey=your-api-key
```

## 📱 How to Use

### Taking the Test
1. **Start**: Click "Start Test" on the homepage
2. **Answer Questions**: Navigate through 30 questions (25 grammar + 5 reading)
3. **Review**: Use Previous/Next buttons to review answers
4. **Cancel**: Click "Cancel Exam" if needed (with Turkish confirmation)
5. **Finish**: Complete all questions and click "Finish Test"

### Understanding Results
- **Overall Score**: X/30 questions correct
- **CEFR Level**: Your English proficiency level (A1-C1)
- **Accuracy**: Percentage score
- **Performance Breakdown**: Grammar vs Reading analysis
- **Learning Report**: Detailed feedback in Turkish with improvement suggestions

### Offline Mode
When AI quota is exceeded:
- Automatically switches to static demo test
- 30 pre-built questions across all CEFR levels
- Basic level assessment without detailed AI analysis
- Turkish notifications about demo mode

## 🏗️ Architecture

### Core Components

```
├── app.js              # Main application controller
├── test-engine.js      # Test generation and flow management
├── gemini-service.js   # AI API integration
├── evaluation.js       # Scoring and level assessment
├── static-test.js      # Offline fallback questions
└── style.css          # Custom styling
```

### Key Features

#### Progressive Difficulty System
```javascript
// Questions scale from A1 → A2 → B1 → B2 → C1
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
const questionsPerLevel = 5; // 25 total grammar questions
```

#### Error Handling & Fallbacks
- **Quota Detection**: Automatic detection of API limit exceeded
- **Graceful Degradation**: Seamless switch to offline mode
- **User Communication**: Clear Turkish messages about system status

#### Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Loading States**: Progress indicators and contextual messages

## 🌟 Demo Features

### AI-Powered Mode (Default)
- Real-time question generation
- Personalized difficulty adaptation
- Detailed learning reports with AI analysis
- Turkish explanations and recommendations

### Offline Demo Mode (Fallback)
- 30 static questions (A1-C1 levels)
- Basic level assessment
- Turkish fallback messages
- No external dependencies

## 🔒 Security & Privacy

- **API Key Management**: Secure handling with environment variables
- **Client-Side Only**: No personal data stored on servers
- **Session-Based**: Test data cleared after completion
- **Error Logging**: No sensitive information in logs

## 🌐 Deployment

### Local Development
```bash
python start.py
```

### Replit Deployment
1. Fork the project on Replit
2. Set `GEMINI_API_KEY` in Secrets
3. Run the project

### Custom Server
- Serve files from any HTTP server
- Ensure API key is properly configured
- Port 5000 is recommended for compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

### Development Guidelines
- Follow existing code style
- Add Turkish translations for user-facing text
- Test both AI and offline modes
- Ensure mobile responsiveness

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent question generation
- **Bootstrap Team** for the responsive framework
- **Font Awesome** for the beautiful icons
- **Turkish Community** for language support feedback

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Questions**: Open a discussion for help
- **Feature Requests**: Submit via GitHub Issues with "enhancement" label

---

**Made with ❤️ for Turkish English learners**

*Discover your English level with our intelligent assessment tool!*