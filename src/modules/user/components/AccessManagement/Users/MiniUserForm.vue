<script setup lang="ts">
import InputText from '@/components/common/InputText.vue';
import MainSelect from '@/components/common/MainSelect.vue';

import { DEFAULT_COUNTRY_CODE, EXAMPLE_PHONE_NUMBER } from '@/config/appConfig';

import { useCommonData } from '@/composables/common/useCommonData';
import { useRegisterUser } from '@/modules/user/composables/AccessManagement/User/useRegisterUser';

const { userForm, userErrors, genderOptions, clearError } = useRegisterUser();
const { countries } = useCommonData();
</script>

<template>
    <div class="grid grid-cols-2 gap-4">
        <InputText
            :placeholder="$lang.firstNamePlaceholder || 'Enter First Name'"
            :label="$lang.firstName || 'First Name'"
            is-required
            v-model="userForm.first_name"
            :invalid="!!userErrors.first_name"
            :message="userErrors.first_name || ''"
            messageType="error"
            @input="clearError('first_name')" />

        <InputText
            :placeholder="$lang.middleNamePlaceholder || 'Enter Last Name'"
            :label="$lang.middleName || 'Middle Name'"
            is-required
            v-model="userForm.middle_name"
            :invalid="!!userErrors.middle_name"
            :message="userErrors.middle_name || ''"
            messageType="error"
            @input="clearError('middle_name')" />

        <InputText
            :placeholder="$lang.lastNamePlaceholder || 'Enter Last Name'"
            :label="$lang.lastName || 'Last Name'"
            is-required
            v-model="userForm.last_name"
            :invalid="!!userErrors.last_name"
            :message="userErrors.last_name || ''"
            messageType="error"
            @input="clearError('last_name')" />

        <!--
            Rendered unconditionally. It used to be `v-if="countries.length > 0"`,
            and this app has no country catalogue, so the field never appeared
            while the schema still required a phone — the form could not be
            saved and there was no visible field to correct.
        -->
        <InputText
            type="tel"
            :labelText="$lang.phone || 'Phone'"
            :placeholder="EXAMPLE_PHONE_NUMBER"
            is-required
            v-model="userForm.phone"
            :invalid="!!userErrors?.phone"
            :message="userErrors?.phone || ''"
            messageType="error"
            :countries="countries"
            :defaultCountry="DEFAULT_COUNTRY_CODE"
            @input="clearError?.('phone')" />

        <InputText
            :placeholder="$lang.emailPlaceholder || 'Enter Email'"
            :label="$lang.email || 'Email'"
            is-required
            v-model="userForm.email"
            :invalid="!!userErrors.email"
            :message="userErrors.email || ''"
            messageType="error"
            @input="clearError('email')" />

        <MainSelect
            :options="genderOptions"
            optionLabel="name"
            optionValue="id"
            :labelText="$lang.gender || 'Gender'"
            is-required
            :placeholder="$lang.genderPlaceholder || 'Select Gender'"
            v-model="userForm.gender"
            :invalid="!!userErrors.gender"
            :message="userErrors.gender || ''"
            messageType="error"
            @input="clearError('gender')" />
    </div>
</template>
