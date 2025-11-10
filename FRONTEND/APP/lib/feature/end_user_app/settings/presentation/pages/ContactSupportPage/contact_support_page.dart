import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class ContactSupportPage extends StatelessWidget {
  const ContactSupportPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final controller = Get.find<SettingsController>();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.scrollToBottom();
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact Support'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Obx(
        () => Column(
          children: [
            Expanded(
              child: Container(
                color: theme.colorScheme.surface.withOpacity(0.05),
                child: ListView.builder(
                  controller: controller.scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: controller.messages.length,
                  itemBuilder: (context, index) {
                    final message = controller.messages[index];
                    final isBot = message.isBot;
                    final timestamp = message.timestamp;
                    final showOptions = message.showOptions;
                    final showContactOptions = message.showContactOptions;
                    final showConfirmButtons = message.showConfirmButtons;
                    final showDeviceSelection = message.showDeviceSelection;
                    final file = message.file;

                    return Align(
                      alignment:
                          isBot ? Alignment.centerLeft : Alignment.centerRight,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75,
                        ),
                        child: Column(
                          crossAxisAlignment: isBot
                              ? CrossAxisAlignment.start
                              : CrossAxisAlignment.end,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                gradient: isBot
                                    ? null
                                    : LinearGradient(
                                        colors: [
                                          theme.colorScheme.primary,
                                          theme.colorScheme.primary
                                              .withOpacity(0.7),
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                color: isBot ? Colors.grey.shade50 : null,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(16),
                                  topRight: const Radius.circular(16),
                                  bottomLeft: isBot
                                      ? const Radius.circular(0)
                                      : const Radius.circular(16),
                                  bottomRight: isBot
                                      ? const Radius.circular(16)
                                      : const Radius.circular(0),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 6,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    message.text,
                                    style: TextStyle(
                                      color: isBot
                                          ? Colors.black87
                                          : theme.colorScheme.onPrimary,
                                      fontSize: 16,
                                      height: 1.4,
                                    ),
                                  ),
                                  if (file != null) ...[
                                    const SizedBox(height: 10),
                                    file.path.toLowerCase().endsWith('.jpg') ||
                                            file.path
                                                .toLowerCase()
                                                .endsWith('.png') ||
                                            file.path
                                                .toLowerCase()
                                                .endsWith('.jpeg')
                                        ? ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            child: Image.file(
                                              file,
                                              width: 160,
                                              height: 160,
                                              fit: BoxFit.cover,
                                            ),
                                          )
                                        : Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: Colors.grey.shade200,
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  Icons.description,
                                                  size: 22,
                                                  color:
                                                      theme.colorScheme.primary,
                                                ),
                                                const SizedBox(width: 10),
                                                Text(
                                                  file.path.isNotEmpty
                                                      ? file.path
                                                          .split('/')
                                                          .last
                                                          .toString()
                                                      : 'Unknown file',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    color: theme
                                                        .colorScheme.primary,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                  ],
                                  if (showOptions) ...[
                                    const SizedBox(height: 14),
                                    _buildOptionButton(
                                      text: 'Contact our support team?',
                                      onTap: controller.handleContactSupport,
                                      theme: theme,
                                    ),
                                    const SizedBox(height: 10),
                                    _buildOptionButton(
                                      text: 'Raise ticket for service request',
                                      onTap: controller.handleRaiseTicket,
                                      theme: theme,
                                    ),
                                  ],
                                  if (showContactOptions) ...[
                                    const SizedBox(height: 14),
                                    Text(
                                      'You can contact us via:',
                                      style:
                                          theme.textTheme.bodySmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Wrap(
                                      spacing: 10,
                                      runSpacing: 8,
                                      children: [
                                        _buildContactButton(
                                          icon: Icons.email,
                                          label: 'Email',
                                          onTap: controller.launchEmail,
                                          theme: theme,
                                        ),
                                        _buildContactButton(
                                          icon: Icons.chat,
                                          label: 'WhatsApp',
                                          onTap: controller.launchWhatsApp,
                                          theme: theme,
                                        ),
                                        _buildContactButton(
                                          icon: Icons.phone,
                                          label: 'Phone Call',
                                          onTap: controller.launchPhone,
                                          theme: theme,
                                        ),
                                      ],
                                    ),
                                  ],
                                  if (showDeviceSelection) ...[
                                    const SizedBox(height: 14),
                                    Obx(() {
                                      final hasCompletedDevices =
                                          controller.completedSubscriptions.isNotEmpty;
                                      return Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade50,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: Colors.grey.shade300),
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Select Device:',
                                              style: theme.textTheme.bodyMedium
                                                  ?.copyWith(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.black87,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            if (!hasCompletedDevices)
                                              Container(
                                                padding:
                                                    const EdgeInsets.all(12),
                                                decoration: BoxDecoration(
                                                  color: Colors.orange.shade50,
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                  border: Border.all(
                                                    color: Colors.orange
                                                        .shade200,
                                                  ),
                                                ),
                                                child: Row(
                                                  children: [
                                                    Icon(
                                                      Icons.info_outline,
                                                      color: Colors.orange
                                                          .shade700,
                                                      size: 20,
                                                    ),
                                                    const SizedBox(width: 12),
                                                    Expanded(
                                                      child: Text(
                                                        'Installation is not Completed yet.',
                                                        style: TextStyle(
                                                          fontSize: 13,
                                                          color: Colors.orange
                                                              .shade700,
                                                          height: 1.4,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              )
                                            else
                                              DropdownButtonFormField<String>(
                                                value: controller
                                                    .selectedDeviceId.value,
                                                hint: const Text(
                                                    'Choose a device'),
                                                isExpanded: true,
                                                dropdownColor: Colors.white,
                                                items: controller
                                                    .completedSubscriptions
                                                    .fold<Map<String, dynamic>>(
                                                        {},
                                                        (uniqueMap, subscription) {
                                                      uniqueMap[
                                                          subscription
                                                              .wpDeviceId!] =
                                                          subscription;
                                                      return uniqueMap;
                                                    })
                                                    .values
                                                    .toList()
                                                    .map((subscription) {
                                                  return DropdownMenuItem<
                                                      String>(
                                                    value:
                                                        subscription.wpDeviceId!,
                                                    child: Text(
                                                      '${subscription.modelName!} (${subscription.wpDeviceId!})',
                                                      style: const TextStyle(
                                                          fontSize: 14),
                                                      overflow: TextOverflow
                                                          .ellipsis,
                                                    ),
                                                  );
                                                }).toList(),
                                                onChanged: (value) {
                                                  if (value != null) {
                                                    controller.selectDevice(
                                                        value);
                                                  }
                                                },
                                                decoration: InputDecoration(
                                                  contentPadding:
                                                      const EdgeInsets
                                                          .symmetric(
                                                    horizontal: 12,
                                                    vertical: 8,
                                                  ),
                                                  border:
                                                      OutlineInputBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            8),
                                                    borderSide: BorderSide(
                                                      color:
                                                          Colors.grey.shade400,
                                                    ),
                                                  ),
                                                  filled: true,
                                                  fillColor: Colors.white,
                                                ),
                                              ),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                  if (showConfirmButtons) ...[
                                    const SizedBox(height: 14),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.start,
                                      children: [
                                        _buildConfirmButton(
                                          text: 'Submit',
                                          onTap: controller
                                                      .hasSubmitted.value ||
                                                  controller.isSubmitting.value
                                              ? null
                                              : controller.submitServiceRequest,
                                          isLoading:
                                              controller.isSubmitting.value,
                                          theme: theme,
                                          color: Colors.green.shade600,
                                        ),
                                        const SizedBox(width: 10),
                                        _buildConfirmButton(
                                          text: 'Cancel',
                                          onTap: controller.isSubmitting.value ||
                                                  controller.hasSubmitted.value
                                              ? null
                                              : controller.cancelServiceRequest,
                                          isLoading: false,
                                          theme: theme,
                                          color: Colors.red.shade600,
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              timestamp != null
                                  ? DateFormat('hh:mm a').format(timestamp)
                                  : 'Unknown time',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.5),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: controller.messageController,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(color: Colors.grey.shade500),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 14,
                        ),
                      ),
                      onSubmitted: controller.sendMessage,
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton(
                    onPressed: controller.showAttachmentOptions,
                    icon: Icon(
                      Icons.attach_file,
                      color: theme.colorScheme.primary,
                      size: 26,
                    ),
                    tooltip: 'Attach file',
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: controller.sendMessage,
                    icon: Icon(
                      Icons.send,
                      color: theme.colorScheme.primary,
                      size: 26,
                    ),
                    tooltip: 'Send message',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionButton({
    required String text,
    required VoidCallback onTap,
    required ThemeData theme,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.secondary.withOpacity(0.9),
              theme.colorScheme.secondary.withOpacity(0.7),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Semantics(
          label: text,
          button: true,
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.black,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContactButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required ThemeData theme,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(
          icon,
          size: 16,
          color: theme.colorScheme.onSurface,
        ),
        label: Text(
          label,
          style: TextStyle(
            color: theme.colorScheme.onSurface,
          ),
        ),
        style: OutlinedButton.styleFrom(
          foregroundColor: theme.colorScheme.onSurface,
          side: BorderSide(color: theme.colorScheme.onSurface.withOpacity(0.5)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          textStyle: const TextStyle(fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildConfirmButton({
    required String text,
    required VoidCallback? onTap,
    required bool isLoading,
    required ThemeData theme,
    required Color color,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: ElevatedButton(
        onPressed: isLoading ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor:
              isLoading ? color.withOpacity(0.5) : color, // Visual feedback
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(fontSize: 14),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(text),
      ),
    );
  }
}
