<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useForgotPassword } from '@/modules/user/composables/login/useForgotPassword';
import NavBar from '@/modules/user/components/NavBar.vue';
import Footer from '@/modules/user/components/Footer.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import ChangePassword from '@/modules/user/components/Auth/ChangePassword.vue';

const route = useRoute();
const router = useRouter();
const contact = route.query.contact as string;

const { resetPassword } = useForgotPassword();
</script>

<template>
    <div class="flex w-full items-center justify-between px-4 dark:bg-slate-900">
        <NavBar />
        <ThemeToggle />
    </div>

    <ChangePassword
        :email="contact"
        @success="(pwd: string) => resetPassword(contact, pwd)"
        @cancel="router.push('/forgot-password')" />

    <Footer />
</template>
