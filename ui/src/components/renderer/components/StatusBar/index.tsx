import styles from './styles.module.css';
import { useStatusBarData } from './hook';


export default function StatusBar() {
  const { connectionStatus } = useStatusBarData();

  return (
    <div className={styles.statusBarContainer}>
      <ul>
        {/* <li>Querym v{pkg.version}</li> */}
        {!!connectionStatus?.version && <li>{connectionStatus?.version}</li>}
        {!!connectionStatus?.status && (
          <li>
            <span
              style={{
                color:
                  connectionStatus.status === 'Connected'
                    ? '#27ae60'
                    : '#e74c3c',
              }}
            >
              ⬤
            </span>
            &nbsp;&nbsp;{connectionStatus.status}
          </li>
        )}
        <li style={{ flexGrow: 1 }}></li>
      </ul>
    </div>
  );
}
