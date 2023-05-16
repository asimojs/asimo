import { render } from 'preact';
import { asm } from '@asimojs/asimo';
import { MainLayout } from './views/main';

// Load service implementations
import './api';
import './stores/nav';
import './stores/search';

import './app.css';
import { NavServiceIID } from './stores/types';

async function main() {
    if ((import.meta as any).env?.DEV) {
        // DEV ONLY
        // import independnt bundles to avoid separate bulid and benefit from vite auto-reload
        // these bundles will be built and loaded separately in production mode
        await import('./bundles/common');
    }

    const nav = (await asm.get(NavServiceIID))!;
    render(<div className='mainapp'>
        <MainLayout nav={nav} />
    </div>, document.getElementById('main')!);
}

main();
