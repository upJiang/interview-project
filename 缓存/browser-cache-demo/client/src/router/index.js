import { createRouter, createWebHistory } from "vue-router";

// 页面组件
import CacheControlPage from "../views/CacheControlPage.vue";
import ComparisonPage from "../views/ComparisonPage.vue";
import HomePage from "../views/HomePage.vue";
import ImageCachePage from "../views/ImageCachePage.vue";
import NegotiatedCachePage from "../views/NegotiatedCachePage.vue";
import StrongCachePage from "../views/StrongCachePage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/strong-cache",
      name: "strong-cache",
      component: StrongCachePage,
    },
    {
      path: "/negotiated-cache",
      name: "negotiated-cache",
      component: NegotiatedCachePage,
    },
    {
      path: "/cache-control",
      name: "cache-control",
      component: CacheControlPage,
    },
    {
      path: "/image-cache",
      name: "image-cache",
      component: ImageCachePage,
    },
    {
      path: "/comparison",
      name: "comparison",
      component: ComparisonPage,
    },
  ],
});

export default router;
