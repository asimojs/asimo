import { render } from 'preact';
import { Counter } from './components/counter';
// import './app.css';

async function main() {
    render(<div>
        Sample component: <Counter />
    </div>, document.getElementById('main')!);
}

main();
