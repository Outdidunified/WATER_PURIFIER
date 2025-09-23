class AIService {
  Future<String> generateResponse(String userMessage) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 800));

    // Simple logic to generate a response based on the user's message
    final lowerCaseMessage = userMessage.toLowerCase();
    if (lowerCaseMessage.contains('hello') || lowerCaseMessage.contains('hi')) {
      return 'Hello! How can I assist you today?';
    } else if (lowerCaseMessage.contains('issue') ||
        lowerCaseMessage.contains('problem')) {
      return 'I’m sorry to hear about your issue. Can you provide more details so we can assist you better?';
    } else if (lowerCaseMessage.contains('contact')) {
      return 'You can contact our support team through various channels. Would you like to see the options?';
    } else if (lowerCaseMessage.contains('ticket') ||
        lowerCaseMessage.contains('service')) {
      return 'Let’s create a service ticket for you. Please provide a description of the issue.';
    } else {
      return 'Thank you for your message. How can I help you today?';
    }
  }
}
