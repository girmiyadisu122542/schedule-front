<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useForgotPassword } from '@/modules/user/composables/login/useForgotPassword';

import NavBar from '@/modules/user/components/NavBar.vue';
import Footer from '@/modules/user/components/Footer.vue';
import InputText from '@/components/common/InputText.vue';
import MainButton from '@/components/common/MainButton.vue';
import FieldWrapper from '@/components/wrapper/FieldWrapper.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LeftArrowIcon from '@/assets/icons/LeftArrowIcon.vue';

const { isSubmitting, errors, clearError, sendOtp } = useForgotPassword();
const email = ref('');
</script>

<template>
    <div class="flex w-full items-center justify-between px-4 dark:bg-slate-900">
        <div class="flex items-center">
            <NavBar />
        </div>
        <div class="flex items-center">
            <ThemeToggle />
        </div>
    </div>

    <main
        class="flex h-full min-h-[calc(90vh-5rem)] w-full items-center justify-center px-4 duration-300 dark:bg-slate-900">
        <div
            class="border-input bg-schedule-generic-white border-schedule-border-subtle relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/90">
            <section>
                <div class="flex flex-col items-center gap-1 px-6 pt-8 text-center md:px-8">
                    <h3 class="text-schedule-text-primary dark:text-schedule-text-tertiary text-3xl font-medium">
                        {{ $lang.forgotPassword }}
                    </h3>
                    <p class="text-schedule-text-tertiary text-xl font-normal">
                        {{ $lang.pleaseEnterYourEmailDuringRegistration }}
                    </p>
                </div>

                <form
                    class="space-y-6 px-6 py-6 md:px-8 md:pb-8"
                    @submit.prevent="sendOtp(email)">
                    <div class="space-y-4">
                        <FieldWrapper
                            :required="true"
                            :label="$lang.email || 'Email'">
                            <InputText
                                v-model="email"
                                placeholder="schedule@gmail.com"
                                variant="outlined"
                                size="large"
                                :invalid="!!errors.email"
                                messageType="error"
                                :message="errors.email || ''"
                                autocomplete="email"
                                @input="clearError('email')" />
                        </FieldWrapper>

                        <div class="mt-3 py-2">
                            <MainButton
                                type="submit"
                                width="full"
                                size="normal"
                                :loading="isSubmitting"
                                :disabled="isSubmitting"
                                :label="
                                    isSubmitting ? $lang.sending || 'Sending...' : $lang.requestReset || 'Request Reset'
                                " />
                        </div>

                        <RouterLink
                            :to="{ name: 'Login' }"
                            class="text-schedule-text-brand-primary flex items-center justify-center space-x-2 text-sm font-normal">
                            <LeftArrowIcon />
                            {{ $lang.backToLogin }}
                        </RouterLink>
                    </div>
                </form>
            </section>
        </div>
    </main>
    <Footer />
</template>
