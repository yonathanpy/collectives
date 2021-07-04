<template>
	<DashboardWidget id="collectives_panel"
		:items="recentPages"
		:loading="loading('dashboard')">
		<template #default="{ item }">
			<DashboardWidgetItem
				:target-url="getPageUrl(item)"
				:main-text="`${page.collective} - ${page.title}`"
				:sub-text="lastUpdate(item)"
				:item="item"
				v-on="handlers">
				<template #avatar>
					// TODO: avatar
				</template>
			</DashboardWidgetItem>
		</template>
		<template #empty-content>
			<EmptyContent
				id="collectives-widget-empty-content"
				icon="icon-collectives">
				{{ t('collectives', 'Collectives') }}
				<template #desc>
					{{ t('collectives', 'Come, organize and build shared knowledge!') }}
				</template>
				<button :class="{ primary }" @click="newCollective">
					{{ t('collectives', 'Create new collective') }}
				</button>
			</EmptyContent>
		</template>
	</DashboardWidget>
</template>

<script>

import { mapGetters } from 'vuex'
import moment from '@nextcloud/moment'
import EmptyContent from '@nextcloud/vue/dist/Components/EmptyContent'
import { DashboardWidget, DashboardWidgetItem } from '@nextcloud/vue-dashboard'
import { GET_COLLECTIVES } from './store/actions'

export default {
	name: 'Dashboard',

	components: {
		DashboardWidget,
		DashboardWidgetItem,
		EmptyContent,
	},

	data() {
		return {
			recentPages: [],
		}
	},

	computed: {
		...mapGetters([
			'loading',
			'collectives',
		]),

		/**
		 * Path to the page
		 * @returns {string}
		 */
		pagePath() {
			return (page) => {
				const parts = page.filePath.split('/')
				if (page.fileName !== 'Readme.md') {
					parts.push(page.title)
				}
				return parts
					.filter(Boolean)
					.map(p => encodeURIComponent(p))
					.join('/')
			}
		},

		getPageUrl() {
			return (page) => {
				return generateUrl(`apps/collectives/${encodeURIComponent(page.collective)}/${this.pagePath(page)}`)
			}
		},

		lastUpdate() {
			return (page) => {
				return moment.unix(page.timestamp).fromNow()
			}
		},

		newCollective() {
			return generateUrl('apps/collectives')
		}
	},

	beforeMount() {
		this.getCollectives()
	},

	methods: {
		/**
		 * Get list of all collectives
		 * @returns {Promise}
		 */
		getCollectives() {
			return this.$store.dispatch(GET_COLLECTIVES)
		},

		async recentPages() {
			for (const i in this.collectives) {
				// TODO: retrieve most recent pages from all collectives
			}
		},
	},

}
</script>

<style lang="scss">
#collectives_panel {
	#collectives-widget-empty-content {
		text-align: center;
		margin-top: 5vh;

		.empty-label {
			margin-top: 5vh;
			margin-right: 5px;
		}
	}
}
</style>
