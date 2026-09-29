import { McpServiceWorkerBroker } from '@/mcp/broker/service-worker'
import rules from '@/public/rules/figma.json'
import { isRules } from '@/rewrite/shared'
import { logger } from '@/utils/log'

const SYNC_ALARM = 'sync-rules'
const SYNC_INTERVAL_MINUTES = 10

async function syncRules() {
  try {
    if (!isRules(rules)) {
      logger.error('Bundled rewrite rules are invalid.')
      return
    }
    const newRules = rules

    const oldIds = (await browser.declarativeNetRequest.getDynamicRules()).map(({ id }) => id)

    await browser.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['figma']
    })

    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldIds,
      addRules: newRules
    })
    logger.log(`Updated ${newRules.length} rule${newRules.length === 1 ? '' : 's'}.`)
  } catch (error) {
    logger.error('Error applying bundled rules:', error)
  }
}

export default defineBackground(() => {
  new McpServiceWorkerBroker().start()

  browser.runtime.onInstalled.addListener(syncRules)

  browser.runtime.onStartup.addListener(syncRules)

  browser.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_INTERVAL_MINUTES })
  browser.alarms.onAlarm.addListener((a) => {
    if (a.name === SYNC_ALARM) {
      syncRules()
    }
  })
})
