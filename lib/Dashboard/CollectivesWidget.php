<?php

namespace OCA\Collectives\Dashboard;

use OCP\Dashboard\IWidget;
use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Util;

class CollectivesWidget implements IWidget {
	/**
	 * @var IL10N
	 */
	private $l10n;

	/**
	 * @var IURLGenerator
	 */
	private $urlGenerator;

	public function __construct(IL10N $l10n,
		IURLGenerator $urlGenerator) {
		$this->l10n = $l10n;
		$this->urlGenerator = $urlGenerator;
	}

	/**
	 * @inheritdoc
	 */
	public function getId(): string {
		return 'collectives';
	}

	/**
	 * @inheritDoc
	 */
	public function getTitle(): string {
		return $this->l10n->t('Recent collective pages');
	}

	/**
	 * @inheritDoc
	 */
	public function getOrder(): int {
		return 10;
	}

	/**
	 * @inheritDoc
	 */
	public function getIconClass(): string {
		return 'icon-collectives';
	}

	/**
	 * @inheritDoc
	 */
	public function getUrl(): ?string {
		return $this->urlGenerator->linkToRouteAbsolute('collectives.start.index');
	}

	/**
	 * @inheritDoc
	 */
	public function load(): void {
		Util::addStyle('collectives', 'icons');
		Util::addScript('collectives', 'dashboard');
	}
}
