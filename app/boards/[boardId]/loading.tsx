export default function BoardLoading() {
  return (
    <div className="board-loading" aria-label="Loading board" aria-busy="true">
      <div className="board-loading-toolbar">
        <span className="ui-skeleton" />
        <span className="ui-skeleton" />
        <span className="ui-skeleton" />
      </div>
      <div className="board-loading-columns">
        {[0, 1, 2, 3].map((column) => (
          <div className="board-loading-column" key={column}>
            <span className="ui-skeleton board-loading-title" />
            <span className="ui-skeleton board-loading-card" />
            <span className="ui-skeleton board-loading-card" />
          </div>
        ))}
      </div>
    </div>
  );
}
