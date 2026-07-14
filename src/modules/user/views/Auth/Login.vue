<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { useLogin } from '@/modules/user/composables/login/useLogin';

import ThemeToggle from '@/components/ThemeToggle.vue';
import NavBar from '@/modules/user/components/NavBar.vue';
import InputText from '@/components/common/InputText.vue';
import Footer from '@/modules/user/components/Footer.vue';
import MainButton from '@/components/common/MainButton.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';

import EyeIcon from '@/assets/icons/EyeIcon.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import EyeSlashIcon from '@/assets/icons/EyeSlashIcon.vue';

const {
    errors,
    formData,
    isSubmitting,
    showPassword,
    clearError,
    handleSubmit,
    checkRememberMe,
    togglePasswordVisibility
} = useLogin();
</script>

<template>
    <div class="flex w-full items-center justify-between px-4">
        <div class="flex items-center">
            <NavBar />
        </div>
        <div class="flex items-center">
            <ThemeToggle :with-text="false" />
        </div>
    </div>
    <main class="flex h-full min-h-[calc(90vh-5rem)] w-full items-center justify-center px-4 duration-300">
        <div
            class="bg-surface-card border-border-default text-text-primary relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border backdrop-blur-sm">
            <div class="">
                <section class="lg:col-span-7">
                    <div class="flex items-center justify-center gap-5 space-y-2 p-6 md:px-8">
                        <div class="flex flex-col items-start justify-start gap-1 text-center">
                            <h3 class="text-text-primary text-3xl font-semibold">
                                {{ $lang.scheduleSystem }}
                            </h3>

                            <p class="text-text-tertiary text-xl font-normal">
                                {{ $lang.signInYourAccount }}
                            </p>
                        </div>
                    </div>

                    <form
                        class="space-y-6 px-6 md:px-8 md:pb-8"
                        @submit.prevent="handleSubmit">
                        <div class="space-y-2">
                            <FieldWrapper
                                :required="false"
                                label="">
                                <InputText
                                    :label="$lang.emailOrPhone"
                                    v-model="formData.username"
                                    :placeholder="$lang.emailOrPhone"
                                    variant="outlined"
                                    size="large"
                                    :invalid="!!errors?.username"
                                    messageType="error"
                                    @input="clearError('username')"
                                    :message="errors?.username ? errors?.username : ''"
                                    autocomplete="email" />
                            </FieldWrapper>

                            <FieldWrapper
                                :required="false"
                                label="">
                                <InputText
                                    :type="showPassword ? 'text' : 'password'"
                                    v-model="formData.password"
                                    :label="$lang.password"
                                    :placeholder="$lang.enterPassword"
                                    :invalid="!!errors.password"
                                    :message="errors.password ? errors.password : ''"
                                    messageType="error"
                                    size="large"
                                    variant="outlined"
                                    autocomplete="current-password"
                                    @input="() => clearError('password')">
                                    <template #suffix>
                                        <span
                                            @click="togglePasswordVisibility"
                                            class="cursor-pointer text-gray-500 duration-200 dark:text-gray-300">
                                            <EyeIcon v-if="!showPassword" />
                                            <EyeSlashIcon v-else />
                                        </span>
                                    </template>
                                </InputText>
                            </FieldWrapper>

                            <div class="mt-8 flex items-center justify-between">
                                <div class="flex items-center justify-center space-x-2">
                                    <div
                                        @click="checkRememberMe()"
                                        :class="{
                                            'bg-schedule-brand-blue': formData.rememberMe
                                        }"
                                        class="border-border-default flex h-4 w-4 shrink-0 cursor-pointer justify-center self-center rounded-sm border md:h-5 md:w-5 lg:h-6 lg:w-6">
                                        <CheckIcon
                                            v-if="formData.rememberMe"
                                            class="h-4 w-4 self-center text-white" />
                                    </div>
                                    <label class="self-center text-sm font-medium">
                                        {{ $lang.rememberMe }}
                                    </label>
                                </div>
                                <RouterLink
                                    to="/forgot-password"
                                    class="text-schedule-brand-blue inline-flex cursor-pointer items-center justify-center gap-2 rounded-md p-0 text-sm font-normal">
                                    {{ $lang.forgotPassword }}
                                </RouterLink>
                            </div>

                            <div class="mt-3 py-2">
                                <MainButton
                                    type="submit"
                                    width="full"
                                    size="normal"
                                    :loading="isSubmitting"
                                    :disabled="isSubmitting"
                                    :label="isSubmitting ? $lang.signingIn : $lang.signIn" />
                            </div>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    </main>
    <Footer />
</template>
