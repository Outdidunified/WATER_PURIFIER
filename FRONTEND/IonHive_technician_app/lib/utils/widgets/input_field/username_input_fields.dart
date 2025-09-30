import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// Username Input Widget
class UsernameInput extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;

  const UsernameInput({
    super.key,
    required this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
  });

  @override
  State<UsernameInput> createState() => _AdvancedUsernameInputState();
}

class _AdvancedUsernameInputState extends State<UsernameInput> {
  bool _hasError = false;
  bool _isValid = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = _hasError
        ? theme.colorScheme.error
        : _isValid
            ? theme.colorScheme.primary
            : theme.dividerColor;

    return TextField(
      controller: widget.controller,
      focusNode: widget.focusNode,
      decoration: InputDecoration(
        labelText: 'Username',
        labelStyle: theme.textTheme.bodyMedium,
        filled: true,
        fillColor: theme.colorScheme.surface,
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        errorText:
            _hasError ? "Enter a valid username (min 3 characters)" : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor, width: 2.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: borderColor, width: 2.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: theme.primaryColor, width: 2.0),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: theme.colorScheme.error, width: 2.0),
        ),
        prefixIcon: const Icon(Icons.person, color: Colors.blueAccent),
      ),
      onChanged: (value) {
        setState(() {
          _hasError = value.trim().length < 3;
          _isValid = value.trim().length >= 3;
        });
        widget.onChanged?.call(value.trim());
      },
      onSubmitted: widget.onSubmitted, // Handle "Next" or "Done" action
      keyboardType: TextInputType.text,
      textInputAction: TextInputAction.next, // Show "Next" on keyboard
      style: theme.textTheme.bodyLarge,
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9_]')),
      ],
    );
  }
}
