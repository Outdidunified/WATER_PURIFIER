import 'package:aquapulse_app/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:aquapulse_app/utils/widgets/button/custom_button.dart';
import 'package:aquapulse_app/utils/widgets/error/error_display_widget.dart';
import 'package:aquapulse_app/utils/widgets/input_field/city_input_fields.dart';
import 'package:aquapulse_app/utils/widgets/input_field/phonenumber_inputfield.dart';
import 'package:aquapulse_app/utils/widgets/input_field/username_input_fields.dart';
import 'package:aquapulse_app/utils/widgets/loading/linear_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart'; // For formatting the date

class EditAccountPage extends StatefulWidget {
  const EditAccountPage({super.key});

  @override
  State<EditAccountPage> createState() => _EditAccountPageState();
}

class _EditAccountPageState extends State<EditAccountPage> {
  late final FocusNode usernameFocusNode;
  late final FocusNode cityFocusNode;
  late final FocusNode phoneFocusNode;

  @override
  void initState() {
    super.initState();
    usernameFocusNode = FocusNode();
    cityFocusNode = FocusNode();
    phoneFocusNode = FocusNode();
  }

  @override
  void dispose() {
    usernameFocusNode.dispose();
    cityFocusNode.dispose();
    phoneFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final SettingsController controller = Get.find<SettingsController>();
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Account',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
            color: Colors.white,
            letterSpacing: 1.5,
          ),
        ),
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Get.back(),
        ),
      ),
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(() {
        if (controller.isLoading.value) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: LinearLoadingIndicator(
                color: theme.colorScheme.primary,
                height: 4.0,
                widthFactor: 0.3,
              ),
            ),
          );
        } else if (controller.errorMessage.value.isNotEmpty) {
          return ErrorDisplayWidget(
            errorMessage: controller.errorMessage.value,
            onRetry: () {
              controller.fetchUserDetails();
            },
          );
        }
        if (controller.userData.value == null) {
          return Center(
            child: Text(
              'No user data available',
              style: TextStyle(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
                fontSize: screenWidth * 0.04,
              ),
            ),
          );
        }

        // Format the modified date or use a fallback
        final modifiedDate = controller.userData.value?.data.modified_date;
        debugPrint("Modified Date: $modifiedDate"); // Debug log
        final formattedDate = modifiedDate != null
            ? DateFormat('MMMM dd, yyyy').format(modifiedDate)
            : 'Not updated yet';

        return SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom:
                MediaQuery.of(context).viewInsets.bottom, // Adjust for keyboard
          ),
          child: Column(
            children: [
              Stack(
                children: [
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          theme.colorScheme.primary,
                          theme.colorScheme.primary.withOpacity(0.8),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 20,
                    left: 100,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 50,
                            backgroundColor:
                                theme.colorScheme.primary.withOpacity(0.1),
                            child: Icon(
                              Icons.person,
                              size: 70,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.01),
                        Text(
                          (controller.userData.value?.data.name ?? '').isEmpty
                              ? 'Complete your profile'
                              : controller.userData.value!.data.name!,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: screenWidth * 0.045,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        // Display the modified date
                        Text(
                          'Last updated: $formattedDate',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: screenWidth * 0.035,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              SizedBox(height: screenHeight * 0.02),
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.02,
                ),
                child: AnimatedOpacity(
                  opacity: 1.0,
                  duration: const Duration(milliseconds: 500),
                  child: Form(
                    key: controller.formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Edit Your Profile',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: screenWidth * 0.05,
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        UsernameInput(
                          controller: controller.editNameController,
                          focusNode: usernameFocusNode,
                          onChanged: (value) => controller.validateForm(),
                          onSubmitted: (_) {
                            FocusScope.of(context).requestFocus(cityFocusNode);
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        CityInput(
                          controller: controller.editCityController,
                          focusNode: cityFocusNode,
                          onChanged: (value) => controller.validateForm(),
                          onSubmitted: (_) {
                            FocusScope.of(context).requestFocus(phoneFocusNode);
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        PhoneNumberInput(
                          controller: controller.editPhoneController,
                          focusNode: phoneFocusNode,
                          onChanged: (phone) {
                            final phoneNumber =
                                phone.replaceAll('+91', '').trim();
                            controller.editPhoneController.text = phoneNumber;
                            controller.validateForm();
                          },
                          onSubmitted: (_) {
                            FocusScope.of(context).unfocus();
                          },
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        TextField(
                          decoration: InputDecoration(
                            labelText: "Email",
                            labelStyle: theme.textTheme.bodyMedium,
                            filled: true,
                            fillColor:
                                theme.colorScheme.primary.withOpacity(0.1),
                            enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                  color: theme.colorScheme.primary
                                      .withOpacity(0.6),
                                  width: 2.0),
                            ),
                            disabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                  color: theme.colorScheme.primary
                                      .withOpacity(0.2),
                                  width: 2.0),
                            ),
                          ),
                          controller: TextEditingController(
                            text:
                                controller.userData.value?.data.email ?? 'N/A',
                          ),
                          enabled: false,
                          style: TextStyle(
                            fontSize: screenWidth * 0.04,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                        SizedBox(height: screenHeight * 0.02),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "LOCATION",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: screenWidth * 0.04,
                                color: theme.colorScheme.onSurface,
                              ),
                            ),
                            Text(
                              "India",
                              style: TextStyle(
                                fontSize: screenWidth * 0.04,
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.6),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: screenHeight * 0.04),
                        Center(
                          child: Obx(() {
                            return CustomButton(
                              text: "Save Changes",
                              isLoading: controller.isEditLoading.value,
                              onPressed: controller.isFormValid.value &&
                                      !controller.isEditLoading.value
                                  ? () async {
                                      final userData =
                                          controller.userData.value!.data;
                                      await controller.updateUserDetails(
                                        userId: userData.userId,
                                        email: userData.email,
                                        name: controller.editNameController.text
                                            .trim(),
                                        phone: controller
                                            .editPhoneController.text
                                            .trim(),
                                        city: controller.editCityController.text
                                            .trim(),
                                      );
                                    }
                                  : () {},
                              borderRadius: 12.0,
                              padding: EdgeInsets.symmetric(
                                horizontal: screenWidth * 0.1,
                                vertical: screenWidth * 0.04,
                              ),
                              gradient: LinearGradient(
                                colors: controller.isFormValid.value &&
                                        !controller.isEditLoading.value
                                    ? [
                                        theme.colorScheme.primary,
                                        theme.colorScheme.primary
                                            .withOpacity(0.8),
                                      ]
                                    : [
                                        Colors.grey.shade400,
                                        Colors.grey.shade500,
                                      ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              textStyle: TextStyle(
                                fontSize: screenWidth * 0.04,
                                fontWeight: FontWeight.w600,
                              ),
                              boxShadow: BoxShadow(
                                color: theme.primaryColor.withOpacity(0.5),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            );
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
