import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerClientTools } from './tools/clients.js';
import { registerContractTools } from './tools/contracts.js';
import { registerContractLogTools } from './tools/contract-logs.js';
import { registerAuditLogTools } from './tools/audit-logs.js';
import { registerCollaboratorTools } from './tools/collaborators.js';
import { registerAssignmentTools } from './tools/assignments.js';
const server = new McpServer({
    name: 'nexus-mcp',
    version: '1.0.0',
    description: 'Read-only access to NexusCS customer success data',
});
registerClientTools(server);
registerContractTools(server);
registerContractLogTools(server);
registerAuditLogTools(server);
registerCollaboratorTools(server);
registerAssignmentTools(server);
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map