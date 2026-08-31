<script setup lang="ts">
export interface CategoryPickerItem {
  id: number | string;
  icon: string;
}

interface Props {
  categories: CategoryPickerItem[];
  modelValue?: number;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  title: "Explora otras categorías",
});

const emit = defineEmits<{
  (e: "update:modelValue", index: number): void;
  (e: "select", index: number): void;
}>();

const selectCategory = (index: number) => {
  emit("update:modelValue", index);
  emit("select", index);
};
</script>

<template>
  <section class="explore-categories">
    <h3>{{ title }}</h3>
    <div class="categories-carousel-wrapper">
      <button type="button" class="carousel-arrow">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <div class="categories-list">
        <div
          v-for="(cat, idx) in categories"
          :key="cat.id"
          :class="['category-icon-item', { active: modelValue === idx }]"
          @click="selectCategory(idx)"
        >
          <div class="icon-circle">
            <i :class="cat.icon"></i>
          </div>
        </div>
      </div>
      <button type="button" class="carousel-arrow">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  </section>
</template>

<style scoped>
.explore-categories {
  background-color: #f5f7f9;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
}

.explore-categories h3 {
  font-size: 1rem;
  color: #023859;
  margin-bottom: 1rem;
  font-weight: 600;
}

.categories-carousel-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.carousel-arrow {
  background: transparent;
  border: none;
  color: #ff6a00;
  font-size: 1.5rem;
  cursor: pointer;
}

.categories-list {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
  overflow-x: auto;
}

.category-icon-item {
  cursor: pointer;
}

.category-icon-item .icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #cdece8;
  color: #00a896;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.category-icon-item.active .icon-circle {
  background-color: #00a896;
  color: #ffffff;
}
</style>
