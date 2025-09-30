import 'dart:io';

class MessageModel {
  final String text;
  final bool isBot;
  final DateTime timestamp;
  final bool showOptions;
  final bool showContactOptions;
  final bool showConfirmButtons;
  final bool showDeviceSelection;
  final File? file;

  MessageModel({
    required this.text,
    required this.isBot,
    required this.timestamp,
    this.showOptions = false,
    this.showContactOptions = false,
    this.showConfirmButtons = false,
    this.showDeviceSelection = false,
    this.file,
  });

  // Convert to JSON for API calls
  Map<String, dynamic> toJson() => {
        'text': text,
        'isBot': isBot,
        'timestamp': timestamp.toIso8601String(),
        'showOptions': showOptions,
        'showContactOptions': showContactOptions,
        'showConfirmButtons': showConfirmButtons,
        'showDeviceSelection': showDeviceSelection,
        'filePath': file?.path,
      };

  // Create from JSON (for API responses)
  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        text: json['text'] as String,
        isBot: json['isBot'] as bool,
        timestamp: DateTime.parse(json['timestamp'] as String),
        showOptions: json['showOptions'] as bool? ?? false,
        showContactOptions: json['showContactOptions'] as bool? ?? false,
        showConfirmButtons: json['showConfirmButtons'] as bool? ?? false,
        showDeviceSelection: json['showDeviceSelection'] as bool? ?? false,
        file:
            json['filePath'] != null ? File(json['filePath'] as String) : null,
      );

  // Updated copyWith method
  MessageModel copyWith({
    String? text,
    bool? isBot,
    DateTime? timestamp,
    bool? showOptions,
    bool? showContactOptions,
    bool? showConfirmButtons,
    bool? showDeviceSelection,
    File? file,
  }) {
    return MessageModel(
      text: text ?? this.text,
      isBot: isBot ?? this.isBot,
      timestamp: timestamp ?? this.timestamp,
      showOptions: showOptions ?? this.showOptions,
      showContactOptions: showContactOptions ?? this.showContactOptions,
      showConfirmButtons: showConfirmButtons ?? this.showConfirmButtons,
      showDeviceSelection: showDeviceSelection ?? this.showDeviceSelection,
      file: file ?? this.file,
    );
  }
}
