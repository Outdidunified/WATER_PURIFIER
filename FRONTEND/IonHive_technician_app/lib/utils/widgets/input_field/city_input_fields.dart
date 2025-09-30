import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// City Input Widget
class CityInput extends StatefulWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;

  const CityInput({
    super.key,
    required this.controller,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
  });

  @override
  State<CityInput> createState() => _AdvancedCityInputState();
}

class _AdvancedCityInputState extends State<CityInput> {
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
        labelText: 'City',
        labelStyle: theme.textTheme.bodyMedium,
        filled: true,
        fillColor: theme.colorScheme.surface,
        contentPadding:
            const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        errorText: _hasError ? "Enter a valid city (min 2 characters)" : null,
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
        prefixIcon: const Icon(Icons.location_city, color: Colors.blueAccent),
      ),
      onChanged: (value) {
        setState(() {
          _hasError = value.trim().length < 2;
          _isValid = value.trim().length >= 2;
        });
        widget.onChanged?.call(value.trim());
      },
      onSubmitted: widget.onSubmitted, // Handle "Next" action
      keyboardType: TextInputType.text,
      textInputAction: TextInputAction.next, // Show "Next" on keyboard
      style: theme.textTheme.bodyLarge,
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z\s]')),
      ],
    );
  }
}
