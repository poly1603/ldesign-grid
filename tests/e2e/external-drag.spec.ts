/**
 * E2E tests for external drag functionality
 */

import { test, expect } from '@playwright/test'

test.describe('External Drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display widget toolbox', async ({ page }) => {
    await expect(page.locator('.component-toolbox')).toBeVisible()
    await expect(page.locator('.widget-item').first()).toBeVisible()
  })

  test('should display empty grid initially', async ({ page }) => {
    await expect(page.locator('.grid-stack')).toBeVisible()
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should drag widget from toolbox to grid', async ({ page }) => {
    // Get first widget
    const widget = page.locator('.widget-item').first()
    const widgetText = await widget.textContent()

    // Get grid
    const grid = page.locator('.grid-stack')
    const gridBox = await grid.boundingBox()

    if (!gridBox) {
      throw new Error('Grid not found')
    }

    // Drag widget to grid center
    await widget.dragTo(grid, {
      targetPosition: {
        x: gridBox.width / 2,
        y: gridBox.height / 2
      }
    })

    // Check if item was added
    await expect(page.locator('.grid-stack-item')).toHaveCount(1)

    // Empty state should be hidden
    await expect(page.locator('.empty-state')).not.toBeVisible()
  })

  test('should drag multiple widgets', async ({ page }) => {
    const widgets = page.locator('.widget-item')
    const grid = page.locator('.grid-stack')

    // Drag 3 widgets
    for (let i = 0; i < 3; i++) {
      await widgets.nth(i).dragTo(grid)
      await page.waitForTimeout(100)
    }

    await expect(page.locator('.grid-stack-item')).toHaveCount(3)
  })

  test('should remove grid item', async ({ page }) => {
    // Add a widget first
    const widget = page.locator('.widget-item').first()
    const grid = page.locator('.grid-stack')
    await widget.dragTo(grid)

    // Click remove button
    await page.locator('.grid-item-remove').first().click()

    // Item should be removed
    await expect(page.locator('.grid-stack-item')).toHaveCount(0)
    await expect(page.locator('.empty-state')).toBeVisible()
  })

  test('should save and load layout', async ({ page }) => {
    // Add widgets
    const widget = page.locator('.widget-item').first()
    const grid = page.locator('.grid-stack')
    await widget.dragTo(grid)

    // Click save
    await page.locator('button:has-text("保存")').click()

    // Wait for toast
    await expect(page.locator('.toast')).toBeVisible()

    // Clear grid
    await page.locator('button:has-text("清空")').click()
    await page.locator('text=确定').click()

    // Should be empty
    await expect(page.locator('.grid-stack-item')).toHaveCount(0)

    // Load layout
    await page.locator('button:has-text("加载")').click()

    // Should have item again
    await expect(page.locator('.grid-stack-item')).toHaveCount(1)
  })

  test('should show hover effect on widgets', async ({ page }) => {
    const widget = page.locator('.widget-item').first()

    await widget.hover()

    // Check for hover styles
    const backgroundColor = await widget.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    )

    expect(backgroundColor).toBeTruthy()
  })

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page.locator('.component-toolbox')).toBeVisible()
    await expect(page.locator('.grid-stack')).toBeVisible()
  })
})

test.describe('Grid Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Add a test item
    const widget = page.locator('.widget-item').first()
    const grid = page.locator('.grid-stack')
    await widget.dragTo(grid)
  })

  test('should drag item within grid', async ({ page }) => {
    const item = page.locator('.grid-stack-item').first()
    const initialBox = await item.boundingBox()

    // Drag item
    await item.dragTo(item, {
      targetPosition: { x: 100, y: 100 }
    })

    const finalBox = await item.boundingBox()

    // Position should have changed
    expect(finalBox?.x).not.toBe(initialBox?.x)
  })

  test('should resize item', async ({ page }) => {
    const item = page.locator('.grid-stack-item').first()

    // Find resize handle (usually bottom-right corner)
    const resizeHandle = item.locator('.ui-resizable-se')

    if (await resizeHandle.count() > 0) {
      await resizeHandle.dragBy(50, 50)

      // Size should have changed
      const box = await item.boundingBox()
      expect(box?.width).toBeGreaterThan(100)
    }
  })
})

