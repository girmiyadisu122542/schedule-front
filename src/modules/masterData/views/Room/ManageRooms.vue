<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useLanguageStore } from '@/stores/languageStore';
import { useRoom } from '@/modules/masterData/composables/useRoom';
import { useLookupValues } from '@/composables/useLookupValues';
import { LOOKUP_TYPE } from '@/modules/masterData/constants/lookupTypes';

import Badge from '@/components/common/Badge.vue';
import BoolChip from '@/components/common/BoolChip.vue';
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import MainTable from '@/components/common/MainTable.vue';
import ActionMenu from '@/components/common/ActionMenu.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import ImportDialog from '@/components/common/ImportDialog.vue';
import RoomFormDialog from '@/modules/masterData/components/Room/RoomFormDialog.vue';

import KeyIcon from '@/assets/icons/KeyIcon.vue';
import { STATUS_SUCCESS, STATUS_LIGHT } from '@/config/appConfig';
import type { Room } from '@/modules/masterData/types/room';

const { customizeLanguageData } = useLanguageStore();
const roomTypes = useLookupValues(LOOKUP_TYPE.ROOM_TYPE);
const {
    isLoading,
    rooms,
    tableColumns,
    filterFields,
    dialogVisible,
    isEditingDialog,
    editForm,
    editErrors,
    isSavingEdit,
    confirmState,
    fetchRooms,
    handleSearch,
    handleFilterChange,
    getActionOptions,
    openCreateDialog,
    saveRoomForm,
    entityLabel,
    importOrderHint,
    canExport,
    canImport,
    exportFormats,
    isExporting,
    isUploading,
    isDownloadingTemplate,
    importDialogVisible,
    mode,
    report,
    hasPreviewed,
    canCommit,
    rowsToWrite,
    openImportDialog,
    closeImportDialog,
    setFile,
    setMode,
    previewImport,
    confirmImport,
    exportList,
    downloadTemplate
} = useRoom();

const breadcrumbItems = computed(() => [{ label: customizeLanguageData('rooms', 'Rooms') }]);

/** Label and colour both come from the lookup value — never a hardcoded string. */
const roomTypeChip = (room: Room) => roomTypes.resolve(room.room_type_code);

/** "New Block → Main Campus" — a room's location is only complete through both. */
const locationOf = (room: Room) => [room.building?.name, room.campus?.name].filter(Boolean).join(' → ') || '—';

onMounted(() => {
    fetchRooms();
});
</script>

<template>
    <div class="space-y-6">
        <div class="pb-2">
            <Breadcrumb
                :items="breadcrumbItems"
                :icon="KeyIcon" />
        </div>

        <div>
            <div class="mb-4">
                <h1 class="text-text-primary text-xl font-semibold">
                    {{ $lang.manageRooms || 'Manage Rooms' }}
                </h1>
                <p class="text-md text-text-tertiary font-normal">
                    {{
                        $lang.manageRoomsDesc ||
                        'Bookable venues for classes and exams. Teaching and spaced-exam capacity are tracked separately.'
                    }}
                </p>
            </div>

            <MainTable
                :columns="tableColumns"
                :items="rooms"
                :loading="isLoading"
                :filter-fields="filterFields"
                :server-side-filter="true"
                css-clases="rounded-2xl"
                :search-placeholder="$lang.searchRooms || 'Search rooms...'"
                :show-add-button="$can('createRoom')"
                :show-refresh="true"
                :show-import="canImport"
                :show-export="canExport"
                :export-formats="exportFormats"
                :export-loading="isExporting"
                @import="openImportDialog"
                @export="exportList"
                @refresh="fetchRooms"
                @add="openCreateDialog"
                @search="handleSearch"
                @filter-change="handleFilterChange"
                @update:currentPage="(page: number) => fetchRooms({ page })"
                @update:limit="(value: number) => fetchRooms({ perPage: value })">
                <template #cell-name="{ item }">
                    <span class="text-text-secondary">{{ (item as Room).name || (item as Room).code }}</span>
                </template>

                <template #cell-location="{ item }">
                    <span class="text-text-secondary">{{ locationOf(item as Room) }}</span>
                </template>

                <template #cell-room_type_code="{ item }">
                    <Badge
                        outlined
                        :variant="STATUS_LIGHT"
                        :style="{
                            color: roomTypeChip(item as Room)?.color ?? undefined,
                            borderColor: roomTypeChip(item as Room)?.color ?? undefined
                        }"
                        :label="roomTypeChip(item as Room)?.name || (item as Room).room_type?.name || '—'" />
                </template>

                <template #cell-capacity="{ item }">
                    <span class="text-text-secondary">
                        {{ (item as Room).capacity }}
                        <span
                            v-if="(item as Room).exam_capacity"
                            class="text-text-tertiary text-xs">
                            / {{ (item as Room).exam_capacity }} {{ $lang.exam || 'exam' }}
                        </span>
                    </span>
                </template>

                <template #cell-is_exam_venue="{ item }">
                    <BoolChip :value="(item as Room).is_exam_venue" />
                </template>

                <template #cell-is_active="{ item }">
                    <Badge
                        outlined
                        :variant="(item as Room).is_active ? STATUS_SUCCESS : STATUS_LIGHT"
                        :label="(item as Room).is_active ? $lang.active || 'Active' : $lang.inactive || 'Inactive'" />
                </template>

                <template #action="{ item }">
                    <ActionMenu :options="getActionOptions(item as Room)" />
                </template>
            </MainTable>
        </div>

        <RoomFormDialog
            v-model:visible="dialogVisible"
            :is-editing="isEditingDialog"
            :is-saving="isSavingEdit"
            :form="editForm"
            :errors="editErrors"
            @save="saveRoomForm" />

        <ConfirmDialog
            v-model:show="confirmState.show"
            :title="confirmState.title"
            :message="confirmState.message"
            :item-label="confirmState.itemLabel"
            :item-name="confirmState.itemName"
            :item-names="confirmState.itemNames"
            :status-transition="confirmState.statusTransition"
            :confirm-label="confirmState.confirmLabel"
            :cancel-label="$lang.cancel"
            :type="confirmState.type"
            :loading="confirmState.loading"
            @confirm="confirmState.onConfirm" />

        <ImportDialog
            :visible="importDialogVisible"
            :entity-label="entityLabel"
            :import-order-hint="importOrderHint"
            :is-uploading="isUploading"
            :is-downloading-template="isDownloadingTemplate"
            :report="report"
            :has-previewed="hasPreviewed"
            :can-commit="canCommit"
            :rows-to-write="rowsToWrite"
            :mode="mode"
            @update:visible="closeImportDialog"
            @update:mode="setMode"
            @file="setFile"
            @preview="previewImport"
            @confirm="confirmImport"
            @template="downloadTemplate" />
    </div>
</template>
