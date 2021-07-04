import Vue from 'vue'
import { generateFilePath } from '@nextcloud/router'
import { getRequestToken } from '@nextcloud/auth'
import { translate, translatePlural } from '@nextcloud/l10n'
import Dashboard from './views/Dashboard'
import store from './store'

// eslint-disable-next-line
__webpack_nonce__ = btoa(getRequestToken())

// eslint-disable-next-line
__webpack_public_path__ = generateFilePath('collectives', '', 'js/')

Vue.prototype.t = t
Vue.prototype.n = n
Vue.prototype.OC = OC
Vue.prototype.OCA = OCA

document.addEventListener('DOMContentLoaded', function() {
	OCA.Dashboard.register('collectives', (el) => {
		const View = Vue.extend(Dashboard)
		new View({
			store,
			propsData: {},
		}).$mount(el)
	})
})
