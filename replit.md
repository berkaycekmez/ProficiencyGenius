# English Proficiency Test Application

## Overview

This is an AI-powered English proficiency test application that provides adaptive assessment of English language skills. The application uses Google's Gemini AI to generate personalized questions and evaluates users across different CEFR levels (A1-C1). It features a progressive difficulty system that adapts to user performance and provides comprehensive feedback with skill recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla JavaScript, HTML, and CSS
- **Screen-based Navigation**: Uses a screen management system with show/hide functionality for different app states (homepage, loading, test, results, error)
- **Event-driven Architecture**: Central event listener system in the main app controller handles all user interactions
- **Responsive Design**: Bootstrap 5 framework for mobile-first responsive layout
- **Component Structure**: Modular JavaScript classes for separation of concerns

### Core Components
- **EnglishTestApp (app.js)**: Main application controller that orchestrates the entire test flow and manages UI state transitions
- **TestEngine (test-engine.js)**: Manages test generation, question flow, and user interaction logic with progressive difficulty adaptation
- **Evaluator (evaluation.js)**: Handles scoring algorithms, CEFR level assessment, and performance analysis with detailed feedback generation
- **GeminiService (gemini-service.js)**: Abstraction layer for Google Gemini AI API interactions with error handling and retry logic

### Question Generation System
- **Progressive Difficulty**: Adaptive question generation that adjusts difficulty based on user performance
- **Mixed Question Types**: Combines grammar questions and reading comprehension exercises
- **AI-Generated Content**: Dynamic question creation using Gemini AI with structured prompts
- **CEFR Alignment**: Questions mapped to Common European Framework levels (A1-C1)

### Assessment Engine
- **Real-time Scoring**: Continuous evaluation of user responses with immediate feedback
- **Level Threshold System**: Score-based classification into CEFR proficiency levels
- **Performance Analytics**: Detailed breakdown of strengths and areas for improvement
- **Skill Mapping**: Specific skill recommendations based on performance patterns

### State Management
- **In-memory Storage**: Client-side state management without persistent storage
- **Session-based**: Test results and progress stored only during active session
- **API Key Management**: Secure handling of Gemini API keys with fallback prompts

## External Dependencies

### AI Service Integration
- **Google Gemini AI API**: Primary service for question generation and content creation
- **API Key Authentication**: Requires valid Gemini API key for functionality
- **Rate Limiting Considerations**: Built-in retry logic for API call failures

### Frontend Libraries
- **Bootstrap 5.3.0**: CSS framework for responsive design and UI components
- **Font Awesome 6.4.0**: Icon library for visual elements and user interface enhancement

### Node.js Dependencies
- **@google/genai**: Official Google Generative AI SDK for Gemini API integration
- **google-auth-library**: Authentication library for Google services
- **ws**: WebSocket library for real-time communication capabilities

### Browser APIs
- **LocalStorage**: For temporary API key storage and user preferences
- **URL Parameters**: For configuration and API key injection in deployment environments
- **DOM Manipulation**: Native browser APIs for dynamic content updates and user interaction handling