<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { storeToRefs } from 'pinia';

import { useLanguageStore } from '@/stores/languageStore';
import axiosInstance from '@/api/axiosInstance';

import CoverPhoto from '@/modules/user/components/UserProfile/CoverPhoto.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

import MonitorIcon from '@/assets/icons/MonitorIcon.vue';

interface Session {
    id: number;
    device: string;
    ip: string;
    user_agent: string;
    login_time: string | null;
    last_used: string | null;
    is_current: boolean;
}

const { translations } = storeToRefs(useLanguageStore()) as any;

const sessions = ref<Session[]>([]);
const isLoading = ref(true);
const isTerminating = ref<number | null>(null);
const isTerminatingAll = ref(false);
const confirmTerminateVisible = ref(false);
const sessionToTerminate = ref<Session | null>(null);
const terminateMode = ref<'single' | 'all'>('single');

const activeSessions = computed(() => sessions.value.filter((s) => s.is_current));
const otherSessions = computed(() => sessions.value.filter((s) => !s.is_current));
const confirmTerminateTitle = computed(() => translations.value?.terminate || 'Terminate');
const confirmTerminateMessage = computed(() =>
    terminateMode.value === 'all'
        ? translations.value?.terminateAllSessions || 'Are you sure you want to terminate all sessions? This action cannot be undone.'
        : translations.value?.terminateSession || 'Are you sure you want to terminate this session? This action cannot be undone.'
);
const isConfirmLoading = computed(() => terminateMode.value === 'all'
        ? isTerminatingAll.value
        : sessionToTerminate.value !== null && isTerminating.value === sessionToTerminate.value.id
);

const formatLastSeen = (time: string | null) => {
    if (!time) return '-';

    const diff = Date.now() - new Date(time).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;

    const hrs = Math.floor(mins / 60);

    if (hrs < 24) return `${hrs}h ago`;

    return `${Math.floor(hrs / 24)}d ago`;
};

const fetchSessions = async () => {
    isLoading.value = true;
    try {
        const response = await axiosInstance.get('/account/sessions');
        sessions.value = response.data.data ?? [];
    } catch {
        toast.error(translations.value?.somethingWentWrong || 'Something went wrong');
    } finally {
        isLoading.value = false;
    }
};

const terminateSession = async (id: number) => {
    isTerminating.value = id;
    try {
        await axiosInstance.delete(`/account/sessions/${id}`);
        sessions.value = sessions.value.filter((s) => s.id !== id);
        toast.success(translations.value?.sessionTerminatedSuccessfully || 'Session terminated');
    } catch (e: any) {
        toast.error(e?.response?.data?.message || translations.value?.somethingWentWrong || 'Something went wrong');
    } finally {
        isTerminating.value = null;
    }
};

const terminateAllSessions = async () => {
    isTerminatingAll.value = true;
    try {
        await axiosInstance.delete('/account/sessions');
        sessions.value = sessions.value.filter((s) => s.is_current);
        toast.success(translations.value?.allSessionsTerminatedSuccessfully || 'All sessions terminated');
    } catch (e: any) {
        toast.error(e?.response?.data?.message || translations.value?.somethingWentWrong || 'Something went wrong');
    } finally {
        isTerminatingAll.value = false;
    }
};

const openTerminateSessionConfirm = (session: Session) => {
    if (session.is_current) return;
    terminateMode.value = 'single';
    sessionToTerminate.value = session;
    confirmTerminateVisible.value = true;
};

const openTerminateAllConfirm = () => {
    terminateMode.value = 'all';
    sessionToTerminate.value = null;
    confirmTerminateVisible.value = true;
};

const confirmTerminate = async () => {
    if (terminateMode.value === 'all') {
        await terminateAllSessions();
    } else if (sessionToTerminate.value) {
        await terminateSession(sessionToTerminate.value.id);
    }

    if (!isTerminating.value && !isTerminatingAll.value) {
        confirmTerminateVisible.value = false;
        sessionToTerminate.value = null;
    }
};

onMounted(fetchSessions);
</script>

<template>
    <div
        class="bg-schedule-generic-white border-schedule-border-subtle overflow-hidden rounded-2xl border
         dark:border-gray-800 dark:bg-gray-900">
        <CoverPhoto />

        <div class="px-8 pb-8">
            <div class="mb-6 flex items-center justify-between">
                <div>
                    <h4 class="text-schedule-text-secondary text-sm font-semibold dark:text-white">
                        {{ $lang.sessions }}
                    </h4>
                    <p class="text-schedule-text-secondary text-xs font-medium">{{ $lang.placesYouveLoggedIn }}</p>
                </div>
                <button
                    @click="openTerminateAllConfirm"
                    :disabled="isTerminatingAll || otherSessions.length === 0"
                    class="text-schedule-text-tertiary rounded-lg border border-gray-300 px-4 py-2 text-sm font-normal
                     transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                    {{ isTerminatingAll ? $lang.terminating || 'Terminating...' : ($lang.terminateAllSessionsBtn || 'Terminate All Sessions' )}}
                </button>
            </div>

            <div
                v-if="isLoading"
                class="text-schedule-text-tertiary py-8 text-center text-sm">
                {{ $lang.loading || 'Loading...' }}
            </div>

            <div
                v-else
                class="space-y-4">
                <template
                    v-for="session in activeSessions"
                    :key="session.id">
                    <div
                        class="border-schedule-border-subtle bg-schedule-secondary flex items-center justify-between
                         rounded-2xl border p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div class="flex items-center gap-4">
                            <MonitorIcon class="text-schedule-text-primary h-7 w-7" />
                            <div>
                                <p class="text-schedule-generic-black text-xs font-medium dark:text-white">
                                    {{ session.device }}
                                </p>
                                <div class="text-schedule-text-tertiary mt-1 flex items-center gap-2 text-xs">
                                    <span
                                        class="text-schedule-success-hover flex items-center gap-1.5 rounded-full bg-green-100 
                                        px-2 py-0.5 dark:bg-green-900/30">
                                        <span class="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                                        {{ $lang.active || 'Active' }}
                                    </span>
                                    <span>{{ session.ip }}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            @click="openTerminateSessionConfirm(session)"
                            :disabled="isTerminating === session.id || session.is_current"
                            class="border-schedule-border-subtle bg-schedule-generic-white text-schedule-text-tertiary
                             rounded-lg border px-5 py-2 text-xs transition-all hover:bg-red-50 hover:text-red-600
                              disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800">
                            {{ isTerminating === session.id ? '...' : $lang.terminate }}
                        </button>
                    </div>
                </template>

                <div
                    v-if="otherSessions.length > 0"
                    class="py-1">
                    <p class="text-schedule-text-secondary text-xs font-medium">
                        {{ otherSessions.length }} {{ $lang.otherSessions }}
                    </p>
                </div>

                <template
                    v-for="session in otherSessions"
                    :key="session.id">
                    <div
                        class="border-schedule-border-subtle bg-schedule-generic-white flex items-center justify-between 
                        rounded-2xl border p-4 dark:border-gray-800 dark:bg-transparent">
                        <div class="flex items-center gap-4">
                            <MonitorIcon class="text-schedule-text-primary h-7 w-7" />
                            <div>
                                <p class="text-schedule-generic-black text-xs font-medium dark:text-white">
                                    {{ session.device }}
                                </p>
                                <div class="text-schedule-text-tertiary mt-1 flex items-center gap-2 text-xs">
                                    <span>{{ $lang.lastSeen }} {{ formatLastSeen(session.login_time) }}</span>
                                    <span>{{ session.ip }}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            @click="openTerminateSessionConfirm(session)"
                            :disabled="isTerminating === session.id"
                            class="border-schedule-border-subtle bg-schedule-generic-white text-schedule-text-tertiary
                             rounded-lg border px-5 py-2 text-xs transition-all hover:bg-red-50 hover:text-red-600
                              disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800">
                            {{ $lang.terminate }}
                        </button>
                    </div>
                </template>

                <div
                    v-if="sessions.length === 0"
                    class="text-schedule-text-tertiary py-8 text-center text-sm">
                    {{ $lang.noSessionsFound || 'No sessions found.' }}
                </div>
            </div>
        </div>

        <ConfirmDialog
            :show="confirmTerminateVisible"
            :title="confirmTerminateTitle"
            :message="confirmTerminateMessage"
            :confirm-label="$lang.terminate"
            :cancel-label="$lang.cancel"
            type="danger"
            :loading="isConfirmLoading"
            :item-label="terminateMode === 'single' ? $lang.sessions : undefined"
            :item-name="terminateMode === 'single' ? sessionToTerminate?.device : undefined"
            @confirm="confirmTerminate"
            @update:show="confirmTerminateVisible = $event" />
    </div>
</template>
