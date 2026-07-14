<template>
    <div class="mx-auto flex h-20 items-center justify-between px-4">
        <RouterLink
            to="/"
            class="flex items-center">
            <img
                src="@/assets/logo.png"
                alt="Schedule logo"
                class="h-12 w-12 rounded-full object-cover p-1" />
            <div>
                <h1 class="text-schedule-text-primary dark:text-schedule-generic-white text-2xl leading-tight font-medium">
                    {{ $lang.scheduleSystem }}
                </h1>
                <p class="text-schedule-text-tertiary text-[12px]">{{ $lang.yourFutureMarketplace }}</p>
            </div>
        </RouterLink>
    </div>
</template>
