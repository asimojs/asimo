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
    const nav = (await asm.get(NavServiceIID))!;

    render(<div className='mainapp'>
        <MainLayout nav={nav} />
    </div>, document.getElementById('main')!);
}

main();
