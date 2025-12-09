/**
 * DOM操作工具
 */

import type { Position } from '../types';

/** 获取元素相对于文档的偏移 */
export function getOffset(el: HTMLElement): Position {
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return {
    x: rect.left + scrollLeft,
    y: rect.top + scrollTop,
  };
}

/** 从鼠标/触摸事件获取位置 */
export function getEventPosition(e: MouseEvent | TouchEvent): Position {
  if ('touches' in e) {
    const touch = e.touches[0] || e.changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
  }
  return { x: e.clientX, y: e.clientY };
}

/** 检查元素是否匹配选择器 */
export function matches(el: Element, selector: string): boolean {
  return el.matches(selector);
}

/** 查找最近的匹配祖先元素 */
export function closest(el: Element, selector: string): Element | null {
  return el.closest(selector);
}

/** 设置元素样式 */
export function setStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(el.style, styles);
}

/** 创建元素 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  styles?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  if (styles) {
    setStyles(el, styles);
  }
  return el;
}

/** 添加CSS类 */
export function addClass(el: HTMLElement, ...classNames: string[]): void {
  el.classList.add(...classNames.filter(Boolean));
}

/** 移除CSS类 */
export function removeClass(el: HTMLElement, ...classNames: string[]): void {
  el.classList.remove(...classNames.filter(Boolean));
}

/** 切换CSS类 */
export function toggleClass(el: HTMLElement, className: string, force?: boolean): void {
  el.classList.toggle(className, force);
}

/** 检查是否有CSS类 */
export function hasClass(el: HTMLElement, className: string): boolean {
  return el.classList.contains(className);
}

/** requestAnimationFrame polyfill */
export const raf: typeof requestAnimationFrame =
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : (fn) => setTimeout(fn, 16) as unknown as number;

/** cancelAnimationFrame polyfill */
export const cancelRaf: typeof cancelAnimationFrame =
  typeof cancelAnimationFrame !== 'undefined'
    ? cancelAnimationFrame
    : clearTimeout;

/** 获取元素的计算样式 */
export function getComputedStyle(el: HTMLElement): CSSStyleDeclaration {
  return window.getComputedStyle(el);
}

/** 获取元素的transform值 */
export function getTransform(el: HTMLElement): { x: number; y: number } {
  const style = window.getComputedStyle(el);
  const transform = style.transform || style.webkitTransform;

  if (!transform || transform === 'none') {
    return { x: 0, y: 0 };
  }

  const matrix = transform.match(/matrix.*\((.+)\)/);
  if (matrix && matrix[1]) {
    const values = matrix[1].split(', ');
    return {
      x: parseFloat(values[4] || '0'),
      y: parseFloat(values[5] || '0'),
    };
  }

  return { x: 0, y: 0 };
}

/** 检查元素是否在视口内 */
export function isInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

/** 滚动元素到视口内 */
export function scrollIntoView(el: HTMLElement, options?: ScrollIntoViewOptions): void {
  el.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
    ...options,
  });
}

/** 获取可滚动的父元素 */
export function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent: HTMLElement | null = el.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = style.overflow + style.overflowX + style.overflowY;

    if (/(auto|scroll)/.test(overflow)) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return document.documentElement;
}

/** 禁用文本选择 */
export function disableSelection(): void {
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
}

/** 启用文本选择 */
export function enableSelection(): void {
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
}
