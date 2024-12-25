<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    const apiUrl: string = "https://script.google.com/macros/s/AKfycbxL8gAUfuEE9pfJAWJrfkAFNN0tK8gdgItgSxBGJlIU0mNACEYRTetYeZ2OWkdDnsgw/exec";
    const lang: string = "ja";
    const today: Date = new Date();
    const cookieKey: string = "usernames";
    
    let ids: string[] = $state(getRegisteredUsernames());
    let registerUserValue: string = $state("");
    let list: UserEventSummaries = $state({});
    let cols: number = $state(4); 

    async function getEventList(): Promise<void> {
        if (ids.length === 0) {
            return;
        }
        const url = `${apiUrl}?lang=${lang}&${ids.map(id => `ids=${id}`).join("&")}`;
        const response = await fetch(url);
        const summaries: EventSummary[] = await response.json();
        summaries.forEach((e: EventSummary) => {
            const userSummaries = list[e.owner.username] || {
                eventSummaries: [],
                owner: e.owner
            };
            userSummaries.eventSummaries.push(e);
            list[e.owner.username] = userSummaries;
        });
    }
    
    onMount((): () => void => {
        (async () => {
            await getEventList();
        })();
        
        const mediaQueries = [
            window.matchMedia('(max-width: 1024px)'),
            window.matchMedia('(max-width: 768px)'),
            window.matchMedia('(max-width: 480px)')
        ];

        mediaQueries.forEach((query) => query.addEventListener('change', defineCols));

        return () => {
            mediaQueries.forEach((query) => query.removeEventListener('change', defineCols));
        };
    });

    function registerUser() {
        if (!browser) {
            return;
        }
        const regex = /^https:\/\/cluster\.mu\/u\/([^\/?]+)/;
        const result = regex.exec(registerUserValue);
        if (result === null || result.length <= 1) {
            window.alert("URL が正しくありません");
        } else {
            const usernames = getRegisteredUsernames();
            usernames.push(result[1]);
            ids = [...new Set(usernames.filter(e => e !== ""))];
            document.cookie = `${cookieKey}=${ids.join(",")}`;

            (async () => {
                await getEventList();
            })();
        }
    }
    
    function getRegisteredUsernames(): string[] {
        if (!browser) {
            return [];
        }
        return (document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${cookieKey}=`))
            ?.split("=")[1] || "").split(",");
    }

    function defineCols() {
        cols = window.matchMedia('(max-width: 480px)').matches
            ? 1
            : window.matchMedia('(max-width: 768px)').matches
                ? 2
                : window.matchMedia('(max-width: 1024px)').matches
                    ? 3
                    : 4;
    }
    
    function formatDate(date: Date): string {
        return `${date.getFullYear()}/${`${(date.getMonth() + 1)}`.padStart(2, "0")}/${`${date.getDate()}`.padStart(2, "0")} ${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`
    }
    function isSameDate(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
</script>

<style>
    a {
        text-decoration: none;
        color: #4444dd;
        cursor: pointer;
        outline: none;
    }
    #profileUrl {
        width: 220px;
    }
    .notice {
        font-size: 0.8em;
    }
    .userEvents {
        padding: 10px;
    }
    .events {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
    }
    .event {
        box-sizing: border-box;
        padding: 16px;
        border: 1px solid #ccc;
        border-radius: 8px;
    }
    .event.empty {
        border: none;
    }
    .event.col4 {
        flex: 1 1 calc(25% - 16px);
    }
    .event.col3 {
        flex: 1 1 calc(33.3% - 16px);
    }
    .event.col2 {
        flex: 1 1 calc(50% - 16px);
    }
    .event.col1 {
        flex: 1 1 calc(100% - 16px);
    }
    .date {
        font-size: 16pt;
        font-weight: bold;
    }
    .todayEvent {
        color: #dd4444;
    }
    .thumbnail {
        max-width: 100%;
        height: auto;
    }
    .user {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .user img {
        width: 1.5em;
        height: 1.5em;
    }
</style>

<div>
    <h1>cluster の特定のユーザーのイベントだけ表示する君</h1>
    <div id="registerUser">
        <div>
            <span>ユーザー追加</span>
            <input type="text" id="profileUrl" placeholder="https://cluster.mu/u/xxxxxxxx" bind:value={registerUserValue} />
            <input type="submit" id="register" value="Add" onclick={() => registerUser()}/>
        </div>
        <div>
            <span class="notice">
                プロフィールページの URL を入力してください<br>
                削除する時は Cookie を削除してください
            </span>
        </div>
    </div>
    {#each Object.keys(list) as userId}
        <div class="userEvents">
            <h2 class="user">
                <a href="https://cluster.mu/u/{list[userId].owner.username}/events" target="_blank" rel="noopener noreferrer">
                    <img src="{list[userId].owner.photoUrl}"  alt="{list[userId].owner.displayName}" class="icon"/>
                </a>
                <span>
                    <a href="https://cluster.mu/u/{list[userId].owner.username}/events" target="_blank" rel="noopener noreferrer">
                        {list[userId].owner.displayName}
                    </a>
                </span>
            </h2>
            <div class="events">
                {#each list[userId].eventSummaries as event, index}
                    <div class="event {`col${cols}`}">
                        <div>
                            {#if isSameDate(new Date(event.reservation.openDatetime), today)}
                                <span class="date todayEvent">[本日]</span>
                            {/if}
                            <span class="date">{formatDate(new Date(event.reservation.openDatetime))}</span>
                        </div>
                        <img src="{event.thumbnailUrl}"  alt="{event.name}" class="thumbnail"/>
                        <div>
                            <span>{event.name}</span>
                        </div>
                    </div>
                    {#if index === (list[userId].eventSummaries.length - 1)}
                        {#each [...Array(cols - (index + 1) % cols)] as _}
                            <div class="event {`col${cols}`} empty">
                            </div>
                        {/each}
                    {/if}
                {/each}
            </div>
        </div>
    {/each}
</div>