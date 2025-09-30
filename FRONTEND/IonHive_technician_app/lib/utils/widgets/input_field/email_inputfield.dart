import 'package:flutter/material.dart';

class EmailInput extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final String? errorText;
  final void Function(String)? onChanged;
  final bool readOnly;

  const EmailInput({
    super.key,
    required this.controller,
    this.hintText = 'Enter your email',
    this.errorText,
    this.onChanged,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return TextField(
      controller: controller,
      keyboardType: TextInputType.emailAddress,
      onChanged: onChanged,
      readOnly: readOnly,
      decoration: InputDecoration(
        labelText: "Email Address",
        labelStyle: TextStyle(
          color: theme.colorScheme.onBackground,
          fontSize: 16,
        ),
        hintText: "Enter your email",
        hintStyle: TextStyle(
          color: theme.colorScheme.onBackground.withOpacity(0.5),
        ),
        errorText: errorText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: theme.colorScheme.secondary,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: theme.colorScheme.secondary,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: theme.primaryColor,
            width: 2,
          ),
        ),
        filled: true,
        fillColor: theme.cardTheme.color?.withOpacity(0.6),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      style: theme.textTheme.bodyLarge?.copyWith(
        color: theme.colorScheme.onSurface,
      ),
    );
  }
}
