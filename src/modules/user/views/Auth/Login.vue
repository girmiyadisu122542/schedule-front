<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { useLogin } from '@/modules/user/composables/login/useLogin';

import ThemeToggle from '@/components/ThemeToggle.vue';
import InputText from '@/components/common/InputText.vue';
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
    <main class="bg-surface-page text-text-primary grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <!-- Brand panel -->
        <section
            class="bg-schedule-brand-blue-hover dark:bg-surface-subtle relative hidden flex-col justify-between p-10 lg:flex xl:p-14">
            <div class="flex items-center gap-3">
                <img
                    src="@/assets/logo.png"
                    alt="Wollo University"
                    class="border-schedule-border-brand h-14 w-14 shrink-0 rounded-full border object-contain" />
                <div class="leading-tight">
                    <p class="text-schedule-brand-blue text-xl font-bold">
                        {{ $lang.universityName || 'Wollo University' }}
                    </p>
                    <p class="text-text-primary text-lg font-medium">
                        {{ $lang.universityNameLocal || 'ወሎ ዩኒቨርሲቲ' }}
                    </p>
                </div>
            </div>

            <div class="max-w-xl">
                <h1 class="text-schedule-brand-blue text-3xl font-bold whitespace-nowrap xl:text-4xl">
                    {{ $lang.classExamSchedulingSystem || 'Class & Exam Scheduling System' }}
                </h1>
                <p class="text-schedule-text-secondary mt-6 text-lg leading-relaxed">
                    {{
                        $lang.schedulingSystemIntro ||
                        'Plan timetables, manage rooms and instructors, detect conflicts, and generate exam schedules — all in one place.'
                    }}
                </p>
            </div>

            <div></div>
        </section>

        <!-- Sign in panel -->
        <section class="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
            <div class="absolute top-6 right-6">
                <ThemeToggle :with-text="false" />
            </div>

            <!-- Brand header for small screens -->
            <div class="mb-10 flex items-center gap-3 lg:hidden">
                <img
                    src="@/assets/logo.png"
                    alt="Wollo University"
                    class="h-12 w-12 shrink-0 rounded-full object-contain" />
                <div class="leading-tight">
                    <p class="text-schedule-brand-blue text-lg font-bold">
                        {{ $lang.universityName || 'Wollo University' }}
                    </p>
                    <p class="text-text-primary text-base font-medium">
                        {{ $lang.universityNameLocal || 'ወሎ ዩኒቨርሲቲ' }}
                    </p>
                </div>
            </div>

            <div class="mx-auto w-full max-w-md">
                <div class="space-y-2">
                    <h2 class="text-text-primary text-4xl font-semibold">
                        {{ $lang.signIn }}
                    </h2>
                    <p class="text-text-tertiary text-lg font-normal">
                        {{ $lang.signInYourAccount || 'Access the scheduling dashboard with your account.' }}
                    </p>
                </div>

                <form
                    class="bg-surface-card border-border-default mt-8 space-y-6 rounded-2xl border p-6 shadow-sm sm:p-8"
                    @submit.prevent="handleSubmit">
                    <FieldWrapper
                        :required="false"
                        label="">
                        <InputText
                            :label="$lang.emailAddress || 'Email address'"
                            v-model="formData.username"
                            placeholder="you@wu.edu.et"
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

                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <div
                                @click="checkRememberMe()"
                                :class="{
                                    'bg-schedule-brand-blue': formData.rememberMe
                                }"
                                class="border-border-default flex h-5 w-5 shrink-0 cursor-pointer justify-center self-center rounded-sm border">
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

                    <MainButton
                        type="submit"
                        width="full"
                        size="normal"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                        :label="isSubmitting ? $lang.signingIn : $lang.signIn" />
                </form>
            </div>
        </section>
    </main>
</template>
