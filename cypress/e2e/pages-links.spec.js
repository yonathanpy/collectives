/**
 * @copyright Copyright (c) 2022 Jonas <jonas@freesources.org>
 *
 * @author Jonas <jonas@freesources.org>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 *  Tests for basic Page functionality.
 */

let imageId
let textId
let targetPageId
const sourceUrl = new URL(`${Cypress.env('baseUrl')}/index.php/apps/collectives/Link%20Testing/Link%20Source`)

describe('Page', function() {
	before(function() {
		cy.login('bob', { route: '/apps/collectives' })
		cy.deleteAndSeedCollective('Another Collective')
		cy.seedPage('First Page', '', 'Readme.md').then((id) => {
			targetPageId = id
		})
		cy.deleteAndSeedCollective('Link Testing')
		cy.seedPage('Link Target', '', 'Readme.md')
		cy.seedPageContent('Link%20Testing/Link%20Target.md', 'Some content')
		cy.seedPage('Link Source', '', 'Readme.md')
		cy.uploadFile('test.md', 'text/markdown').then((id) => {
			textId = id
		}).then(() => {
			cy.uploadFile('test.png', 'image/png').then((id) => {
				imageId = id
			})
		}).then(() => {
			cy.seedPageContent('Link%20Testing/Link%20Source.md', `
## Links supposed to open in viewer

* Relative link to image in Nextcloud: [image](//test.png?fileId=${imageId})
* Relative link to text file in Nextcloud: [test.md](//test.md?fileId=${textId})

## Links supposed to open in same window

* Link to page in this collective: [Link Target](${Cypress.env('baseUrl')}/index.php/apps/collectives/Link%20Testing/Link%20Target)
* Link to page in other collective: [Another Collective/First Page](${Cypress.env('baseUrl')}/index.php/apps/collectives/Another%20Collective/First%20Page?fileId=${targetPageId})

## Links supposed to open in new window

* Absolute link to another app in Nextcloud: [Contacts absolute](${Cypress.env('baseUrl')}/index.php/apps/contacts)
* Relative link to another app in Nextcloud: [Contacts relative](/index.php/apps/contacts)
* Link to external page: [example.org](http://example.org/)
			`)
		})
	})

	beforeEach(function() {
		cy.login('bob', { route: '/apps/collectives/Link Testing/Link Source' })
		// make sure the page list loaded properly
		cy.contains('.app-content-list-item a', 'Link Target')
	})

	const clickLink = function(href, edit) {
		if (edit) {
			// Change to edit mode
			cy.switchPageMode(1)
			cy.getEditor()
				.find(`a[href="${href}"]`)
				.click()
		} else {
			cy.getReadOnlyEditor()
				.find(`a[href="${href}"]`)
				.click()
		}
	}

	// Expected to open file in viewer and stay on same page
	const testLinkToViewer = function(href, { fileName, viewerFileElement, edit = false }) {
		clickLink(href, edit)
		cy.location().should((loc) => {
			expect(loc.pathname).to.eq(sourceUrl.pathname)
			expect(loc.search).to.eq(sourceUrl.search)
		})
		cy.get('.modal-title').should('contain', fileName)
		cy.get(`.viewer__content > ${viewerFileElement}.viewer__file`).should('exist')

		cy.get('.modal-header > .icons-menu > button.header-close')
			.click()
	}

	// Expected to open in same tab
	const testLinkToSameTab = function(href, { edit = false, isPublic = false, keepRelative = false } = {}) {
		if (keepRelative) {
			clickLink(href, edit)
			href = `${Cypress.env('baseUrl')}${href}`
		} else {
			href = `${Cypress.env('baseUrl')}${href}`
			clickLink(href, edit)
		}

		const url = new URL(href)
		const encodedCollectiveName = encodeURIComponent('Link Testing')
		const pathname = isPublic
			? url.pathname.replace(`/${encodedCollectiveName}`, `/p/\\w+/${encodedCollectiveName}`)
			: url.pathname
		cy.location().should((loc) => {
			expect(loc.pathname).to.match(new RegExp(`^${pathname}$`))
			expect(loc.search).to.eq(url.search)
		})

		cy.go('back')
	}

	// Expected to open in new tab
	const testLinkToNewTab = function(href, { edit = false, isPublic = false, keepRelative = false, isAbsolute = false } = {}) {
		let openStub = null
		cy.window().then(win => {
			openStub = cy.stub(win, 'open').as('open')
		})
		if (keepRelative || isAbsolute) {
			clickLink(href, edit)
		} else {
			href = `${Cypress.env('baseUrl')}${href}`
			clickLink(href, edit)
		}
		cy.get('@open')
			.should('be.calledWith', href)
			.then(() => {
				openStub.restore()
			})

		const encodedCollectiveName = encodeURIComponent('Link Testing')
		const pathname = isPublic
			? sourceUrl.pathname.replace(`/${encodedCollectiveName}`, `/p/\\w+/${encodedCollectiveName}`)
			: sourceUrl.pathname
		cy.location().should((loc) => {
			expect(loc.pathname).to.match(new RegExp(`^${pathname}$`))
			expect(loc.search).to.eq(sourceUrl.search)
		})
	}

	describe('Link handling internal', function() {
		it('Opens link to image in Nextcloud in viewer', function() {
			const href = `/index.php/apps/files/?dir=/&openfile=${imageId}#relPath=//test.png`
			testLinkToViewer(href, { fileName: 'test.png', viewerFileElement: 'img' })
			testLinkToViewer(href, { fileName: 'test.png', viewerFileElement: 'img', edit: true })
		})
		it('Opens link to text file in Nextcloud in viewer', function() {
			const href = `/index.php/apps/files/?dir=/&openfile=${textId}#relPath=//test.md`
			testLinkToViewer(href, { fileName: 'test.md', viewerFileElement: '[data-text-el="editor-container"]' })
			testLinkToViewer(href, { fileName: 'test.md', viewerFileElement: '[data-text-el="editor-container"]', edit: true })
		})
		it('Opens link to page in this collective in same/new tab depending on view/edit mode', function() {
			const href = '/index.php/apps/collectives/Link%20Testing/Link%20Target'
			testLinkToSameTab(href)
			testLinkToNewTab(href, { edit: true })
		})
		it('Opens link to page in other collective in same/new tab depending on view/edit mode', function() {
			const href = `/index.php/apps/collectives/Another%20Collective/First%20Page?fileId=${targetPageId}`
			testLinkToSameTab(href)
			testLinkToNewTab(href, { edit: true })
		})
		it('Opens absolute link to another Nextcloud app in new tab', function() {
			const href = '/index.php/apps/contacts'
			testLinkToNewTab(href)
			testLinkToNewTab(href, { edit: true })
		})
		it('Opens relative link to another Nextcloud app in new tab', function() {
			const href = '/index.php/apps/contacts'
			testLinkToNewTab(href, { keepRelative: true })
			// In edit mode, URL gets opened as absolute.
			// testLinkToNewTab(href, { edit: true, keepRelative: true })
		})
		it('Opens link to external page in new tab', function() {
			const href = 'http://example.org/'
			testLinkToNewTab(href, { isAbsolute: true })
			testLinkToNewTab(href, { edit: true, isAbsolute: true })
		})
	})

	describe('Link handling public share', function() {
		let shareUrl

		it('Share the collective', function() {
			cy.visit('/apps/collectives', {
				onBeforeLoad(win) {
					// navigator.clipboard doesn't exist on HTTP requests (in CI), so let's create it
					if (!win.navigator.clipboard) {
						win.navigator.clipboard = {
							__proto__: {
								writeText: () => {},
							},
						}
					}
					// overwrite navigator.clipboard.writeText with cypress stub
					cy.stub(win.navigator.clipboard, 'writeText', (text) => {
						shareUrl = text
					})
						.as('clipBoardWriteText')
				},
			})
			cy.get('.collectives_list_item')
				.contains('li', 'Link Testing')
				.find('.action-item__menutoggle')
				.click({ force: true })
			cy.intercept('POST', '**/_api/*/share').as('createShare')
			cy.get('button')
				.contains('Share link')
				.click()
			cy.wait('@createShare')
			cy.intercept('PUT', '**/_api/*/share/*').as('updateShare')
			cy.get('input#shareEditable')
				.check({ force: true }).then(() => {
					cy.get('input#shareEditable')
						.should('be.checked')
				})
			cy.wait('@updateShare')
			cy.get('button')
				.contains('Copy share link')
				.click()
			cy.get('@clipBoardWriteText').should('have.been.calledOnce')
		})
		it('Public share: opens link to page in this collective in same/new tab depending on view/edit mode', function() {
			cy.logout()
			cy.visit(`${shareUrl}/Link Source`)
			const href = '/index.php/apps/collectives/Link%20Testing/Link%20Target'
			testLinkToSameTab(href, { isPublic: true })
			// testLinkToNewTab(href, { edit: true, isPublic: true })
		})
		it('Public share: opens link to external page in new tab', function() {
			cy.logout()
			cy.visit(`${shareUrl}/Link Source`)
			const href = 'http://example.org/'
			testLinkToNewTab(href, { isPublic: true, isAbsolute: true })
			testLinkToNewTab(href, { edit: true, isPublic: true, isAbsolute: true })
		})
	})
})
