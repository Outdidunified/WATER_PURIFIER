import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class PasswordInput extends StatefulWidget {
  final TextEditingController controller;
  final String? hintText;
  final String? errorText;
  final void Function(String)? onChanged;
  final bool readOnly;

  const PasswordInput({
    super.key,
    required this.controller,
    this.hintText,
    this.errorText,
    this.onChanged,
    this.readOnly = false,
  });

  @override
  _PasswordInputState createState() => _PasswordInputState();
}

class _PasswordInputState extends State<PasswordInput> {
  final ValueNotifier<bool> _obscureTextNotifier = ValueNotifier<bool>(true);

  @override
  void dispose() {
    _obscureTextNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ValueListenableBuilder<bool>(
      valueListenable: _obscureTextNotifier,
      builder: (context, isObscure, child) {
        return TextField(
          controller: widget.controller,
          obscureText: isObscure,
          readOnly: widget.readOnly,
          onChanged: widget.onChanged,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(4),
          ],
          decoration: InputDecoration(
            labelText: 'Password',
            labelStyle: TextStyle(
              color: theme.colorScheme.onBackground,
              fontSize: 16,
            ),
            hintText: widget.hintText ?? 'Enter 4-digit PIN',
            hintStyle: TextStyle(
              color: theme.colorScheme.onBackground.withOpacity(0.5),
            ),
            errorText: widget.errorText,
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
            suffixIcon: IconButton(
              icon: Icon(
                isObscure ? Icons.visibility_off : Icons.visibility,
                color: theme.iconTheme.color,
              ),
              onPressed: () {
                _obscureTextNotifier.value = !isObscure;
              },
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
      },
    );
  }
}
