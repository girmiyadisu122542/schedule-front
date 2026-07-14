import { ref, computed, onMounted, onUnmounted, provide, inject, watch } from 'vue'
import type { Ref } from 'vue' //

interface SidebarContextType {
  isExpanded: Ref<boolean>
  isMobileOpen: Ref<boolean>
  isHovered: Ref<boolean>
  activeItem: Ref<string | null>
  openSubmenu: Ref<string | null>
  openMenus: Ref<Record<string, boolean>>
  collapsedSubmenuItem: Ref<string | null>
  closeAllMenus: () => void
  closeCollapsedSubmenu: () => void
  openMenuPath: (path: string[]) => void
  openMenuExclusive: (itemName: string, parentNames?: string[]) => void
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  handleToggleSidebar: () => void
  setIsHovered: (isHovered: boolean) => void
  setActiveItem: (item: string | null) => void
  toggleSubmenu: (item: string) => void
  searchBarRef: Ref<any>
  focusSearch: () => void
}

const SidebarSymbol = Symbol()

const STORAGE_KEY = 'sidebar_expanded'

const getStoredExpanded = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored !== null ? JSON.parse(stored) : true
}

export function useSidebarProvider() {
  const isExpanded = ref(getStoredExpanded())
  const isMobileOpen = ref(false)
  const isMobile = ref(false)
  const isHovered = ref(false)
  const activeItem = ref<string | null>(null)
  const openSubmenu = ref<string | null>(null)
  const openMenus = ref<Record<string, boolean>>({})
  const collapsedSubmenuItem = ref<string | null>(null)
  const searchBarRef = ref<any>(null)

  watch(isExpanded, (newValue) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
  })

  const handleResize = () => {
    const mobile = window.innerWidth < 768
    isMobile.value = mobile
    if (!mobile) {
      isMobileOpen.value = false
    }
  }

  const focusSearch = () => {
    if (!isExpanded.value && !isMobileOpen.value) {
      if (window.innerWidth < 1024) {
        isMobileOpen.value = true
      } else {
        isExpanded.value = true
      }
    }

    // Small delay to allow for sidebar transition and SearchBar render
    setTimeout(() => {
      searchBarRef.value?.focus()
    }, 50)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      focusSearch()
    }
  }

  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyDown)
  })

  const toggleSidebar = () => {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value
    } else {
      isExpanded.value = !isExpanded.value
    }
  }

  const toggleMobileSidebar = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const handleToggleSidebar = () => {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value
    } else {
      isExpanded.value = !isExpanded.value
    }
  }

  const setIsHovered = (value: boolean) => {
    isHovered.value = value
  }

  const setActiveItem = (item: string | null) => {
    activeItem.value = item
  }

  const toggleSubmenu = (item: string) => {
    openSubmenu.value = openSubmenu.value === item ? null : item
  }

  const closeAllMenus = () => {
    // Close all menus by clearing the openMenus object
    openMenus.value = {}
    collapsedSubmenuItem.value = null
  }

  const closeCollapsedSubmenu = () => {
    collapsedSubmenuItem.value = null
  }

  const openMenuPath = (path: string[]) => {
    // Open menus in the specified path
    path.forEach(menuName => {
      openMenus.value[menuName] = true
    })
  }

  const openMenuExclusive = (itemName: string, parentNames: string[] = []) => {
    // Accordion: open this item + its ancestor chain, collapse every other branch
    const next: Record<string, boolean> = {}
    parentNames.forEach((name) => {
      next[name] = true
    })
    next[itemName] = true
    openMenus.value = next
    collapsedSubmenuItem.value = null
  }

  const context: SidebarContextType = {
    isExpanded: computed(() => (isMobile.value ? false : isExpanded.value)),
    isMobileOpen,
    isHovered,
    activeItem,
    openSubmenu,
    openMenus,
    collapsedSubmenuItem,
    closeAllMenus,
    closeCollapsedSubmenu,
    openMenuPath,
    openMenuExclusive,
    toggleSidebar,
    toggleMobileSidebar,
    handleToggleSidebar,
    setIsHovered,
    setActiveItem,
    toggleSubmenu,
    searchBarRef,
    focusSearch,
  }

  provide(SidebarSymbol, context)

  return context
}

export function useSidebar(): SidebarContextType {
  const context = inject<SidebarContextType>(SidebarSymbol)
  if (!context) {
    throw new Error(
      'useSidebar must be used within a component that has SidebarProvider as an ancestor',
    )
  }
  return context
}
