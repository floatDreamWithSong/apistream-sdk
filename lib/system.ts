export var DataBase = {
    /**
     * 返回操作是否成功，适合执行DDL语句
     * @param sql 需要执行的sql语句
     */
    execSQL:function(sql: string): boolean{
        return false;
    },
    /**
     * 返回查询结果，适合执行DQL语句
     * @param sql 需要执行的sql语句
     */
    selectList:function<T>(sql: string): T[]{
        return [];
    },
    /**
     * 返回查询结果，适合执行DQL语句
     * @param sql 需要执行的sql语句
     */     
    selectOne:function<T>(sql: string): T{
        return null;
    },
    /**
     * 返回查询结果，适合执行DQL语句
     * @param sql 需要执行的sql语句
     */
    selectCount:function(sql: string): number{
        return 0;
    }
}