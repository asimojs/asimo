import { render } from 'preact';
import { asm } from '@asimojs/asimo';
import { NavServiceIID } from './stores/nav';
import { MainLayout } from './components/main';
import './api';
// import './app.css';


async function main() {
    const nav = (await asm.get(NavServiceIID))!;

    render(<div>
        <MainLayout nav={nav} />
    </div>, document.getElementById('main')!);
}

main();
