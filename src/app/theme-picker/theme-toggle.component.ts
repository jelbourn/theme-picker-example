import {Component, Injectable} from '@angular/core';

/** Injectable facade around localStorage for theme preference to make testing easier. */
@Injectable({providedIn: 'root'})
export class ThemeStorage {
  getThemePreference(): string | null {
    // Wrap localStorage access in try/catch because user agents can block localStorage. If it is
    // blocked, we treat it as if no preference was previously stored.
    try {
      return localStorage.getItem('aio-theme');
    } catch {
      return null;
    }
  }

  setThemePreference(isDark: boolean): void {
    // Wrap localStorage access in try/catch because user agents can block localStorage. If it
    // fails, we persist nothing.
    try {
      localStorage.setItem('aio-theme', String(isDark));
    } catch { }
  }
}

@Component({
  selector: 'app-theme-picker',
  template: `
    <button mat-icon-button type="button" (click)="toggleTheme()"
            [matTooltip]="getToggleLabel()" [attr.aria-label]="getToggleLabel()">
      <mat-icon>
        {{getThemeName()}}_mode
      </mat-icon>
    </button>
  `,
})
export class ThemeToggle {
  isDark: boolean = false;

  constructor(private readonly themeStorage: ThemeStorage) {
    this.initializeThemeFromPreferences();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.updateRenderedTheme();
  }

  private initializeThemeFromPreferences() {
    // Check whether there's an explicit preference in localStorage.
    const storedPreference = this.themeStorage.getThemePreference();

    // If we do have a preference in localStorage, use that. Otherwise,
    // initialize based on the prefers-color-scheme media query.
    if (storedPreference) {
      this.isDark = storedPreference === 'true';
    } else {
      this.isDark = matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }

    // The link elements in the initial page render use the media attribute with
    // prefers-color-scheme, so we only have to do anything if there was a theme specified in
    // localStorage.
    if (storedPreference) {
      this.updateRenderedTheme();
    }
  }

  getThemeName() {
    return this.isDark ? 'dark' : 'light';
  }

  getToggleLabel() {
    return `Switch to ${this.isDark ? 'light' : 'dark'} mode`;
  }

  private updateRenderedTheme() {
    // On initial render there are two link elements that use the `media` attribute to load
    // the desired light/dark theme based on prefers-color-scheme. If we're calling this method,
    // the user has explicitly interacted with the theme toggle. In this case, we remove these
    // default link elements and replace them with a single link element corresponding to the
    // user-selected theme.
    const defaultLinkElements = Array.from(document.querySelectorAll('[aio-theme]'));
    for (const defaultLink of defaultLinkElements) {
      defaultLink.parentNode.removeChild(defaultLink);
    }

    // Get the link element for the user-selected theme if it exists, otherwise create it.
    let customLinkElement = document.getElementById('aio-custom-theme') as HTMLLinkElement | null;
    if (!customLinkElement) {
      customLinkElement = document.createElement('link');
      customLinkElement.id = 'aio-custom-theme';
      customLinkElement.rel = 'stylesheet';
      document.head.appendChild(customLinkElement);
    }

    // Update the href to the selected theme and persist the choice to localStorage.
    customLinkElement.href = `assets/${this.getThemeName()}-theme.css`;
    this.themeStorage.setThemePreference(this.isDark);
  }
}



// FOR UNIT TEST:
class FakeThemeStorage implements ThemeStorage {
  fakeStorage: string | null = null;

  getThemePreference(): string | null {
    return this.fakeStorage;
  }

  setThemePreference(isDark: boolean): void {
    this.fakeStorage = String(isDark);
  }
}
